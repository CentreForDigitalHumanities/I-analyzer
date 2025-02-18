#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

from typing import Dict
import logging

from addcorpus.es_settings import es_settings
from addcorpus.models import Corpus, CorpusConfiguration
from addcorpus.python_corpora.load_corpus import load_corpus_definition
from ianalyzer.elasticsearch import elasticsearch
from .es_alias import (
    add_alias, remove_alias, delete_index
)
from indexing.models import (
    IndexJob, CreateIndexTask, UpdateSettingsTask
)
from es.es_update import run_update_task
from indexing.run_populate_task import populate


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

    if client.indices.exists(index=index_name, allow_no_indices=False):
        if task.delete_existing:
            logger.info('Attempting to clean old index...')
            client.indices.delete(index=index_name, allow_no_indices=False)
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


def update_index_settings(task: UpdateSettingsTask):
    client = task.client()
    client.indices.put_settings(
        settings=task.settings,
        index=task.index.name,
        allow_no_indices=False,
    )


def perform_indexing(job: IndexJob):
    '''
    Run an IndexJob by running all related tasks.

    Tasks are run per type. The order of types is:
    - `CreateIndexTask`
    - `PopulateIndexTask`
    - `UpdateIndexTask`
    - `UpdateSettingsTask`
    - `RemoveAliasTask`
    - `AddAliasTask`
    - `DeleteIndexTask`
    '''
    job.corpus.validate_ready_to_index()

    corpus_name = job.corpus.name

    logger.info(f'Started index job: {job}')

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
        else:
            logger.info(f'Created index `{task.index.name}`')

        client.cluster.health(wait_for_status='yellow')

    for task in job.populateindextasks.all():
        populate(task)
        logger.info('Finished indexing `{}` to index `{}`.'.format(
            corpus_name, task.index.name))

    for task in job.updateindextasks.all():
        run_update_task(task)

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
