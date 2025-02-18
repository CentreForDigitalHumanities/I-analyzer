from typing import Optional, Tuple
import datetime
from django.db import transaction

from addcorpus.models import Corpus
from ianalyzer.elasticsearch import elasticsearch, server_for_corpus
from es.es_alias import (
    get_current_index_name, get_new_version_number,
    indices_with_alias
)
from indexing.models import (
    IndexJob, CreateIndexTask, PopulateIndexTask, UpdateIndexTask,
    RemoveAliasTask, AddAliasTask, UpdateSettingsTask
)
from es.sync import update_server_table_from_settings
from es.models import Server, Index


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
    '''
    Create an IndexJob to index a corpus.

    Depending on parameters, this job may include creating an new index, adding documents,
    running an update script, and rolling over the alias. Parameters are described
    in detail in the documentation for the `index` command.
    '''
    create_new = not (add or update)

    update_server_table_from_settings()

    job = IndexJob.objects.create(corpus=corpus)
    server = _server_for_job(job)
    index, alias = _index_and_alias_for_job(job, prod, create_new)

    if create_new:
        CreateIndexTask.objects.create(
            job=job,
            index=index,
            production_settings=prod,
            delete_existing=clear,
        )

    if not (mappings_only or update):
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

    if prod and create_new:
        UpdateSettingsTask.objects.create(
            job=job,
            index=index,
            settings={"number_of_replicas": 1},
        )

    if prod and rollover:
        for aliased_index in indices_with_alias(server, alias):
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

    return job


def _server_for_job(job: IndexJob):
    server_name = server_for_corpus(job.corpus.name)
    server = Server.objects.get(name=server_name)
    return server


def _index_and_alias_for_job(job: IndexJob, prod: bool, create_new: bool) -> Tuple[Index, str]:
    corpus = job.corpus
    server = _server_for_job(job)
    client = elasticsearch(corpus.name)
    base_name = corpus.configuration.es_index

    if prod:
        alias = corpus.configuration.es_alias or corpus.configuration.es_index
        if create_new:
            next_version = get_new_version_number(client, alias, base_name)
            versioned_name = f'{base_name}-{next_version}'
        else:
            versioned_name = get_current_index_name(
                corpus.configuration, client
            )

        index, _ = Index.objects.get_or_create(
            server=server, name=versioned_name
        )
    else:
        alias = None
        index, _ = Index.objects.get_or_create(
            server=server, name=base_name
        )

    return index, alias
