#!/usr/bin/env python3
from django.db import transaction
from typing import Generator

from addcorpus.models import Corpus, CorpusConfiguration
from ianalyzer.elasticsearch import elasticsearch, server_for_corpus, client_from_config
from es.models import Server, Index
from es.sync import update_server_table_from_settings
from indexing.models import IndexJob, DeleteIndexTask, RemoveAliasTask, AddAliasTask
from es.versioning import highest_version_in_result, version_from_name

import logging
logger = logging.getLogger('indexing')

@transaction.atomic
def create_alias_job(corpus: Corpus, clean=False) -> IndexJob:
    '''
    Create a job to move the alias of a corpus to the index with the highest version
    '''

    job = IndexJob.objects.create(corpus=corpus)

    corpus_config = corpus.configuration
    corpus_name = corpus.name
    update_server_table_from_settings()
    server = Server.objects.get(name=server_for_corpus(corpus_name))
    index_name = corpus_config.es_index
    index_alias = corpus_config.es_alias
    client = elasticsearch(corpus_name)

    alias = index_alias if index_alias else index_name
    indices = client.indices.get(index='{}-*'.format(index_name))
    highest_version = highest_version_in_result(indices, alias)

    for index_name, properties in indices.items():
        is_aliased = alias in properties['aliases'].keys()
        is_highest_version = version_from_name(index_name, alias) == highest_version
        index, _ = Index.objects.get_or_create(server=server, name=index_name)

        if not is_highest_version and clean:
            DeleteIndexTask.objects.create(job=job, index=index)

        if not is_highest_version and is_aliased and not clean:
            RemoveAliasTask.objects.create(job=job, index=index, alias=alias)

        if is_highest_version and not is_aliased:
            AddAliasTask.objects.create(job=job, index=index, alias=alias)

    return job


def add_alias(task: AddAliasTask):
    '''
    Add an alias to an Elasticsearch index, as defined by an AddAliasTask
    '''
    client = task.client()
    client.indices.put_alias(
        index=task.index.name,
        name=task.alias
    )


def remove_alias(task: RemoveAliasTask):
    '''
    Remove an alias from an Elasticsearch index, as defined by a RemoveAliasTask
    '''
    client = task.client()
    client.indices.delete_alias(
        index=task.index.name,
        name=task.alias
    )


def delete_index(task: DeleteIndexTask):
    '''
    Delete an Elasticsearch index, as defined by a DeleteIndexTask
    '''
    client = task.client()
    client.indices.delete(
        index=task.index.name,
    )


def get_current_index_name(corpus: CorpusConfiguration, client) -> str:
    """get the name of the current corpus' associated index"""
    alias = corpus.es_alias or corpus.es_index
    indices = client.indices.get(index=alias)
    return max(sorted(indices.keys()))


def indices_with_alias(server: Server, alias: str) -> Generator[Index, None, None]:
    client = client_from_config(server.configuration)
    if client.indices.exists_alias(name=alias):
        for index_name in client.indices.get_alias(name=alias):
            aliased_index, _ = Index.objects.get_or_create(
                server=server,
                name=index_name,
            )
            yield aliased_index
