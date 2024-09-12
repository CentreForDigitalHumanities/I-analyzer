#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import sys
from typing import Dict, Optional

from elasticsearch import Elasticsearch
import elasticsearch.helpers as es_helpers
from elasticsearch.exceptions import RequestError

from django.conf import settings

from addcorpus.es_settings import es_settings
from addcorpus.models import Corpus, CorpusConfiguration
from addcorpus.python_corpora.load_corpus import load_corpus_definition
from addcorpus.reader import make_reader
from ianalyzer.elasticsearch import elasticsearch
from .es_alias import alias, get_new_version_number
import datetime

import logging
logger = logging.getLogger('indexing')


def _make_es_settings(corpus: Corpus) -> Dict:
    if corpus.has_python_definition:
        corpus_def = load_corpus_definition(corpus.name)
        return corpus_def.es_settings
    return es_settings(
        languages=corpus.configuration.languages,
        stemming_analysis=True,
        stopword_analysis=True,
    )


def _make_es_mapping(corpus_configuration: CorpusConfiguration) -> Dict:
    '''
    Create the ElasticSearch mapping for the fields of this corpus. May be
    passed to the body of an ElasticSearch index creation request.
    '''
    return {
        'properties': {
            field.name: field.es_mapping
            for field in corpus_configuration.fields.all()
            if field.es_mapping and field.indexed
        }
    }


def create(client: Elasticsearch, corpus: Corpus, add: bool = False, clear: bool = False, prod: bool = False):
    '''
    Initialise an ElasticSearch index.
    '''
    corpus_config = corpus.configuration
    index_name = corpus_config.es_index
    es_mapping = _make_es_mapping(corpus_config)

    if add:
        # we add document to existing index - skip creation.
        return None

    if clear:
        logger.info('Attempting to clean old index...')
        client.indices.delete(
            index=index_name, ignore=[400, 404])

    settings = _make_es_settings(corpus)

    if prod:
        logger.info('Using a versioned index name')
        alias = corpus_config.es_alias if corpus_config.es_alias else index_name
        index_name = "{}-{}".format(
            index_name, get_new_version_number(client, alias, index_name))
        if client.indices.exists(index=index_name):
            logger.error('Index `{}` already exists. Do you need to add an alias for it or perhaps delete it?'.format(
                index_name))
            sys.exit(1)

        logger.info('Adding prod settings to index')
        settings['index'].update({
            'number_of_replicas': 0,
            'number_of_shards': 5
        })

    logger.info('Attempting to create index `{}`...'.format(
        index_name))
    try:
        client.indices.create(
            index=index_name,
            settings=settings,
            mappings=es_mapping,
        )
    except RequestError as e:
        if 'already_exists' not in e.error:
            # ignore that the index already exist,
            # raise any other errors.
            raise


def populate(client: Elasticsearch, corpus: Corpus, start=None, end=None):
    '''
    Populate an ElasticSearch index from the corpus' source files.
    '''
    corpus_config = corpus.configuration
    corpus_name = corpus.name
    index_name = corpus_config.es_index
    reader = make_reader(corpus)

    logger.info('Attempting to populate index...')

    # Obtain source documents
    files = reader.sources(
        start=start or corpus_config.min_date,
        end=end or corpus_config.max_date)
    docs = reader.documents(files)

    # Each source document is decorated as an indexing operation, so that it
    # can be sent to ElasticSearch in bulk
    actions = (
        {
            '_op_type': 'index',
            '_index': index_name,
            '_id': doc.get('id'),
            '_source': doc
        } for doc in docs
    )

    corpus_server = settings.SERVERS[
        settings.CORPUS_SERVER_NAMES.get(corpus_name, 'default')]

    # Do bulk operation
    for success, info in es_helpers.streaming_bulk(
        client,
        actions,
        chunk_size=corpus_server["chunk_size"],
        max_chunk_bytes=corpus_server["max_chunk_bytes"],
        raise_on_exception=False,
    ):
        if not success:
            logger.error(f"FAILED INDEX: {info}")


def perform_indexing(
    corpus: Corpus,
    start: Optional[datetime.date] = None,
    end: Optional[datetime.date] = None,
    mappings_only: bool = False,
    add: bool = False,
    clear: bool = False,
    prod: bool = False,
    rollover: bool = False,
):
    corpus.validate_ready_to_index()

    corpus_config = corpus.configuration
    corpus_name = corpus.name
    index_name = corpus_config.es_index

    logger.info('Started indexing `{}` on index {}'.format(
        corpus_name,
        index_name
    ))

    if rollover and not prod:
        logger.warning(
            'rollover flag is set but prod flag not set -- no effect')

    # Create and populate the ES index
    client = elasticsearch(corpus_name)
    logger.info('max_retries: {}'.format(vars(client).get('_max_retries')))

    logger.info('retry on timeout: {}'.format(
        vars(client).get('_retry_on_timeout'))
    )
    create(client, corpus, add, clear, prod)
    client.cluster.health(wait_for_status='yellow')

    if mappings_only:
        logger.info('Created index `{}` with mappings only.'.format(index_name))
        return

    populate(client, corpus, start=start, end=end)

    logger.info('Finished indexing `{}` to index `{}`.'.format(
        corpus_name, index_name))

    if prod:
        logger.info('Updating settings for index `{}`'.format(
            index_name))
        client.indices.put_settings(
            settings={'number_of_replicas': 1},
            index=index_name
        )
        if rollover:
            logger.info('Adjusting alias for index  `{}`'.format(
                index_name))
            alias(corpus)  # not deleting old index, so we can roll back
