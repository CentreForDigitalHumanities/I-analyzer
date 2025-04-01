'''
Functionality to run an IndexJob
'''

import logging
from typing import Callable, Any

from es.client import elasticsearch
from indexing.models import (
    IndexJob, IndexTask, TaskStatus, CreateIndexTask, PopulateIndexTask,
    UpdateSettingsTask, RemoveAliasTask, AddAliasTask, DeleteIndexTask, UpdateIndexTask
)
from indexing.run_populate_task import populate
from indexing.run_create_task import create
from indexing.run_management_tasks import (
    update_index_settings, remove_alias, add_alias, delete_index
)
from indexing.run_update_task import run_update_task


logger = logging.getLogger('indexing')

TASK_HANDLERS = [
    (CreateIndexTask, create),
    (PopulateIndexTask, populate),
    (UpdateIndexTask, run_update_task),
    (UpdateSettingsTask, update_index_settings),
    (RemoveAliasTask, remove_alias),
    (AddAliasTask, add_alias),
    (DeleteIndexTask, delete_index),
]


def _task_handler(task: IndexTask) -> Callable[[IndexTask], Any]:
    '''Select the appropriate function to execute an IndexTask'''
    for (task_type, handler) in TASK_HANDLERS:
        if isinstance(task, task_type):
            return handler
    raise TypeError(f'Unexpected task type: {type(task)}')


def run_task(task: IndexTask) -> None:
    '''Run an IndexTask'''
    task_id = f'{task.__class__.__name__} #{task.pk}' # e.g. "CreateIndexTask #1"
    logger.info(f'Running {task_id}: {task}')

    task.status = TaskStatus.WORKING
    task.save()

    try:
        handler = _task_handler(task)
        handler(task)
    except Exception as e:
        logger.exception(f'{task_id} failed!')
        task.status = TaskStatus.ERROR
        task.save()
        raise e

    task.status = TaskStatus.DONE
    task.save()
    logger.info(f'{task_id} completed')


def cancel_queued_tasks(job: IndexJob):
    '''Mark all remaining queued tasks as cancelled.'''
    for task in job.tasks():
        if task.status == TaskStatus.QUEUED:
            task.status = TaskStatus.CANCELLED
            task.save()


def perform_indexing(job: IndexJob):
    '''
    Run an IndexJob by running all related tasks.
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

    for task in job.tasks():
        task.status = TaskStatus.QUEUED
        task.save()

    for task in job.tasks():
        try:
            run_task(task)

            if isinstance(task, CreateIndexTask):
                client.cluster.health(wait_for_status='yellow')
        except Exception as e:
            cancel_queued_tasks(job)
            raise e
