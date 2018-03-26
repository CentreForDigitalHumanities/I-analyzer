#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import sys
import logging
from datetime import datetime

import elasticsearch as es
import elasticsearch.helpers as es_helpers

from ianalyzer import config_fallback as config
from ianalyzer import factories


def create(client, corpus_definition, clear=False):
    '''
    Initialise an ElasticSearch index.
    '''

    if clear:
        logging.info('Attempting to clean old index...')
        client.indices.delete(index=corpus_definition.es_index, ignore=[400, 404])

    logging.info('Attempting to create index...')
    client.indices.create(
        index=corpus_definition.es_index,
        body=corpus_definition.es_mapping(),
        ignore=400
    )


def populate(client, corpus_name, corpus_definition, start=None, end=None):
    '''
    Populate an ElasticSearch index from the corpus' source files.
    '''

    logging.info('Attempting to populate index...')

    # Obtain source documents
    files = corpus_definition.sources(
        start or corpus_definition.min_date,
        end or corpus_definition.max_date)
    docs = corpus_definition.documents(files)

    # Each source document is decorated as an indexing operation, so that it
    # can be sent to ElasticSearch in bulk
    actions = (
        {
            '_op_type' : 'index',
            '_index' : corpus_definition.es_index,
            '_type' : corpus_definition.es_doctype,
            '_id' : doc.pop('id'),
            '_source' : doc
        } for doc in docs
    )

    corpus_server = config.SERVERS[config.CORPUS_SERVERS[corpus_name]]
    # Do bulk operation
    for result in es_helpers.bulk(
        client,
        actions,
        chunk_size=corpus_server['chunk_size'],
        max_chunk_bytes=corpus_server['max_chunk_bytes'],
        timeout=corpus_server['bulk_timeout'],
        stats_only=True, # We want to know how many documents were added
    ):
        logging.info('Indexed documents ({}).'.format(result))


def perform_indexing(corpus_name, corpus_definition, start, end):

    # Log to a specific file
    logfile = 'indexing-{}-{}.log'.format(
        start.strftime('%Y%m%d'),
        end.strftime('%Y%m%d')
    )
    logging.basicConfig(filename=logfile, level=config.LOG_LEVEL)
    logging.info('Started indexing `{}` from {} to {}...'.format(
        corpus_definition.es_index,
        start.strftime('%Y-%m-%d'),
        end.strftime('%Y-%m-%d')
    ))

    # Create and populate the ES index
    client = factories.elasticsearch(corpus_name)
    create(client, corpus_definition, clear=False)
    client.cluster.health(wait_for_status='yellow')
    populate(client, corpus_name, corpus_definition, start=start, end=end)

    logging.info('Finished indexing `{}`.'.format(corpus_definition.es_index))
