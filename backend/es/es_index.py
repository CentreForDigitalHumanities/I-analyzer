#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import sys

import elasticsearch.helpers as es_helpers
from elasticsearch.exceptions import RequestError

from flask import current_app

from ianalyzer.factories.elasticsearch import elasticsearch
from .es_alias import alias, get_new_version_number

import logging
logger = logging.getLogger('indexing')


def create(client, corpus_definition, add, clear, prod):
    '''
    Initialise an ElasticSearch index.
    '''
    if add:
        # we add document to existing index - skip creation.
        return None

    if clear:
        logger.info('Attempting to clean old index...')
        client.indices.delete(
            index=corpus_definition.es_index, ignore=[400, 404])

    settings = corpus_definition.es_settings

    if prod:
        logger.info('Using a versioned index name')
        alias = corpus_definition.es_alias if corpus_definition.es_alias else corpus_definition.es_index
        corpus_definition.es_index = "{}-{}".format(
            corpus_definition.es_index, get_new_version_number(client, alias, corpus_definition.es_index))
        if client.indices.exists(index=corpus_definition.es_index):
            logger.error('Index `{}` already exists. Do you need to add an alias for it or perhaps delete it?'.format(
                corpus_definition.es_index))
            sys.exit(1)

        logger.info('Adding prod settings to index')
        if not settings.get('index'):
            settings['index'] = {
                'number_of_replicas' : 0,
                'number_of_shards': 6
            }

    logger.info('Attempting to create index `{}`...'.format(
        corpus_definition.es_index))
    try:
        client.indices.create(
            index=corpus_definition.es_index,
            settings = settings,
            mappings = corpus_definition.es_mapping(),
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

    if not type(corpus_definition.es_index)==str:
        raise Exception('es_index is not a string')

    # Each source document is decorated as an indexing operation, so that it
    # can be sent to ElasticSearch in bulk
    actions = (
        {
            '_op_type': 'index',
            '_index': corpus_definition.es_index,
            '_id' : doc.get('id'),
            '_source': doc
        } for doc in docs
    )

    corpus_server = current_app.config['SERVERS'][
        current_app.config['CORPUS_SERVER_NAMES'][corpus_name]]

    for success, info in es_helpers.streaming_bulk(client, actions, chunk_size=corpus_server['chunk_size'], max_chunk_bytes=corpus_server['max_chunk_bytes']):
        if not success:
            logger.error(f"FAILED INDEX: {info}")




def perform_indexing(corpus_name, corpus_definition, start, end, mappings_only, add, clear, prod, rollover):
    logger.info('Started indexing `{}` from {} to {}...'.format(
        corpus_definition.es_index,
        start.strftime('%Y-%m-%d'),
        end.strftime('%Y-%m-%d')
    ))

    if rollover and not prod:
        logger.info('rollover flag is set but prod flag not set -- no effect')

    # Create and populate the ES index
    client = elasticsearch(corpus_name)
    logger.info(
        vars(client).get('_max_retries'))

    logger.info(
        vars(client).get('_retry_on_timeout')
    )
    create(client, corpus_definition, add, clear, prod)
    client.cluster.health(wait_for_status='yellow')

    if mappings_only:
        logger.info('Created index `{}` with mappings only.'.format(corpus_definition.es_index))
        return

    populate(client, corpus_name, corpus_definition, start=start, end=end)

    logger.info('Finished indexing `{}`.'.format(corpus_definition.es_index))

    if prod:
        logger.info('Updating settings for index `{}`'.format(
            corpus_definition.es_index))
        client.indices.put_settings(
            settings={'number_of_replicas': 1},
            index=corpus_definition.es_index
        )
        if rollover:
            logger.info('Adjusting alias for index  `{}`'.format(
                corpus_definition.es_index))
            alias(corpus_name, corpus_definition) # not deleting old index, so we can roll back

