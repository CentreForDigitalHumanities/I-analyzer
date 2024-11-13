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
from django.db import transaction

from addcorpus.es_settings import es_settings
from addcorpus.models import Corpus, CorpusConfiguration
from addcorpus.python_corpora.load_corpus import load_corpus_definition
from addcorpus.reader import make_reader
from ianalyzer.elasticsearch import elasticsearch, server_for_corpus
from .es_alias import (
    alias, get_current_index_name, get_new_version_number,
    add_alias, remove_alias, delete_index
)
import datetime
from indexing.models import (
    IndexJob, CreateIndexTask, PopulateIndexTask, UpdateIndexTask,
    RemoveAliasTask, AddAliasTask, UpdateSettingsTask
)
from es.sync import update_server_table_from_settings
from es.models import Server, Index

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


def create(task: CreateIndexTask):
    client = task.client()

    corpus_config = task.corpus.configuration
    index_name = task.index.name
    es_mapping = _make_es_mapping(corpus_config)

    if client.indices.exists(index=index_name):
        if task.delete_existing:
            logger.info('Attempting to clean old index...')
            client.indices.delete(
                index=index_name, ignore=[400, 404])
        else:
            logger.error(
                'Index `{}` already exists. Do you need to add an alias for it or '
                'perhaps delete it?'.format(index_name)
            )
            raise Exception('index already exists')

    settings = _make_es_settings(task.corpus)

    if task.production_settings:
        logger.info('Adding prod settings to index')
        settings['index'].update({
            'number_of_replicas': 0,
            'number_of_shards': 5
        })

    logger.info('Attempting to create index `{}`...'.format(index_name))

    client.indices.create(
        index=task.index.name,
        settings=settings,
        mappings=es_mapping,
    )
    return index_name


def populate(task: PopulateIndexTask):
    '''
    Populate an ElasticSearch index from the corpus' source files.
    '''
    corpus_config = task.corpus.configuration
    reader = make_reader(task.corpus)

    logger.info('Attempting to populate index...')

    # Obtain source documents
    files = reader.sources(
        start=task.document_min_date or corpus_config.min_date,
        end=task.document_max_date or corpus_config.max_date)
    docs = reader.documents(files)

    # Each source document is decorated as an indexing operation, so that it
    # can be sent to ElasticSearch in bulk
    actions = (
        {
            "_op_type": "index",
            "_index": task.index.name,
            "_id": doc.get("id"),
            "_source": doc,
        }
        for doc in docs
    )

    server_config = task.index.server.configuration

    # Do bulk operation
    client = task.client()
    for success, info in es_helpers.streaming_bulk(
        client,
        actions,
        chunk_size=server_config["chunk_size"],
        max_chunk_bytes=server_config["max_chunk_bytes"],
        raise_on_exception=False,
        raise_on_error=False,
    ):
        if not success:
            logger.error(f"FAILED INDEX: {info}")


def update_index_settings(task: UpdateSettingsTask):
    client = task.client()
    client.indices.put_settings(
        settings=task.settings, index=task.index.name
    )


@transaction.atomic
def create_indexing_job(
    corpus: Corpus,
    start: Optional[datetime.date] = None,
    end: Optional[datetime.date] = None,
    mappings_only: bool = False,
    add: bool = False,
    clear: bool = False,
    prod: bool = False,
    rollover: bool = False,
    update: bool = False,
) -> IndexJob:
        job = IndexJob.objects.create(corpus=corpus)

        update_server_table_from_settings()
        server_name = server_for_corpus(corpus.name)
        server = Server.objects.get(name=server_name)
        client = elasticsearch(corpus.name)
        base_name = corpus.configuration.es_index

        if prod:
            alias = corpus.configuration.es_alias or corpus.configuration.es_index
            if add or update:
                versioned_name = get_current_index_name(
                    corpus.configuration, client
                )
            else:
                next_version = get_new_version_number(client, alias, base_name)
                versioned_name = f'{base_name}-{next_version}'

            index, _ = Index.objects.get_or_create(
                server=server, name=versioned_name
            )

            UpdateSettingsTask.objects.create(
                job=job,
                index=index,
                settings={"number_of_replicas": 1},
            )

            if rollover:
                if client.indices.exists_alias(name=alias):
                    for index_name in client.indices.get_alias(name=alias):
                        aliased_index, _ = Index.objects.get_or_create(
                            server=server,
                            name=index_name,
                        )
                        RemoveAliasTask.objects.create(
                            job=job,
                            index=aliased_index,
                            alias=alias,
                        )
                AddAliasTask.objects.create(
                    job=job,
                    index=index,
                    alias=alias,
                )
        else:
            index, _ = Index.objects.get_or_create(
                server=server, name=base_name
            )

        if not add or update:
            CreateIndexTask.objects.create(
                job=job,
                index=index,
                production_settings=prod,
                delete_existing=clear,
            )

        if not mappings_only or update:
            PopulateIndexTask.objects.create(
                job=job,
                index=index,
                document_min_date=start,
                document_max_date=end,
            )

        if update:
            UpdateIndexTask.objects.create(
                job=job,
                index=index,
                document_min_date=start,
                document_max_date=end,
            )

        return job



def perform_indexing(
    job: IndexJob,
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

    for task in job.createindextasks.all():
        create(task)

        if not job.populateindextasks.exists() or job.updateindextasks.exists():
            logger.info(f'Created index `{task.index.name}` with mappings only.')

    client.cluster.health(wait_for_status='yellow')

    for task in job.populateindextasks.all():
        populate(task)
        logger.info('Finished indexing `{}` to index `{}`.'.format(
            corpus_name, task.index.name))

    for task in job.updatesettingstasks.all():
        logger.info("Updating settings for index `{}`".format(task.index.name))
        update_index_settings(task)

    for task in job.removealiastasks.all():
        logger.info(f'Removing alias `{task.alias}` for index `{task.index.name}`')
        remove_alias(task)

    for task in job.addaliastasks.all():
        logger.info(f'Adding alias `{task.alias}` for index `{task.index.name}`')
        add_alias(task)

    for task in job.deleteindextasks.all():
        logger.info(f'Deleting index {task.index.name}')
        delete_index(task)
