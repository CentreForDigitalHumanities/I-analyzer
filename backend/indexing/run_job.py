'''
Functionality to run an IndexJob
'''

import logging
from typing import Callable, Any

from es.client import elasticsearch
from indexing.models import IndexJob, IndexTask, TaskStatus
from indexing.run_populate_task import populate
from indexing.run_create_task import create
from indexing.run_management_tasks import (
    update_index_settings, remove_alias, add_alias, delete_index
)
from indexing.run_update_task import run_update_task


logger = logging.getLogger('indexing')

def run_task(task: IndexTask, handler: Callable[[IndexTask], Any]):
    logger.info(f'Running index task: {task}')

    task.status = TaskStatus.WORKING
    task.save()

    try:
        handler(task)
    except Exception as e:
        task.status = TaskStatus.ERROR
        task.save()
        raise e

    task.status = TaskStatus.DONE
    task.save()


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
        run_task(task, create)
        client.cluster.health(wait_for_status='yellow')

    for task in job.populateindextasks.all():
        run_task(task, populate)

    for task in job.updateindextasks.all():
        run_task(task, run_update_task)

    for task in job.updatesettingstasks.all():
        run_task(task, update_index_settings)

    for task in job.removealiastasks.all():
        run_task(task, remove_alias)

    for task in job.addaliastasks.all():
        run_task(task, add_alias)

    for task in job.deleteindextasks.all():
        run_task(task, delete_index)
