from celery.contrib.abortable import AbortableAsyncResult
from ianalyzer.celery import app as celery_app
from indexing.models import IndexJob, TaskStatus


def is_stoppable(job: IndexJob):
    return job.status() in [TaskStatus.QUEUED, TaskStatus.WORKING]


def stop_job(job: IndexJob):
    '''
    Cancel or terminate all celery tasks associated with a job, and update task status
    accordingly.
    '''

    for task in job.tasks():
        if task.celery_task_id:
            result = AbortableAsyncResult(task.celery_task_id, app=celery_app)
            result.abort()

    mark_tasks_stopped(job)


def mark_tasks_stopped(job: IndexJob):
    '''
    Mark open tasks as aborted and queued tasks as cancelled.
    '''
    for task_set in job.task_query_sets():
        task_set.filter(status=TaskStatus.QUEUED).update(status=TaskStatus.CANCELLED)
        task_set.filter(status=TaskStatus.WORKING).update(status=TaskStatus.ABORTED)
