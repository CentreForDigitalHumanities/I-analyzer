#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import sys

from datetime import datetime

import elasticsearch.helpers as es_helpers
from elasticsearch.exceptions import RequestError

from flask import current_app

from ianalyzer.factories.elasticsearch import elasticsearch

import logging
logger = logging.getLogger('indexing')

def create(client, corpus_definition, clear):
    '''
    Initialise an ElasticSearch index.
    '''

    if clear:
        logger.info('Attempting to clean old index...')
        client.indices.delete(index=corpus_definition.es_index, ignore=[400, 404])

    logger.info('Attempting to create index...')
    try:
        client.indices.create(
            index=corpus_definition.es_index,
            body={
                'settings': corpus_definition.es_settings,
                'mappings': corpus_definition.es_mapping()
            }
        )
    except RequestError as e:
        if not 'already_exists' in e.error:
            # ignore that the index already exist,
            # raise any other errors.
            raise


def populate(client, corpus_name, corpus_definition, start=None, end=None):
    '''
    Populate an ElasticSearch index from the corpus' source files.
    '''

    logger.info('Attempting to populate index...')

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
            '_source' : doc
        } for doc in docs
    )

    corpus_server = current_app.config['SERVERS'][
        current_app.config['CORPUS_SERVER_NAMES'][corpus_name]]
    # Do bulk operation
    for result in es_helpers.bulk(
        client,
        actions,
        chunk_size=corpus_server['chunk_size'],
        max_chunk_bytes=corpus_server['max_chunk_bytes'],
        timeout=corpus_server['bulk_timeout'],
        stats_only=True, # We want to know how many documents were added
    ):
        logger.info('Indexed documents ({}).'.format(result))


def perform_indexing(corpus_name, corpus_definition, start, end, clear):
    logger.info('Started indexing `{}` from {} to {}...'.format(
        corpus_definition.es_index,
        start.strftime('%Y-%m-%d'),
        end.strftime('%Y-%m-%d')
    ))

    # Create and populate the ES index
    client = elasticsearch(corpus_name)
    create(client, corpus_definition, clear)
    client.cluster.health(wait_for_status='yellow')
    populate(client, corpus_name, corpus_definition, start=start, end=end)

    logger.info('Finished indexing `{}`.'.format(corpus_definition.es_index))
