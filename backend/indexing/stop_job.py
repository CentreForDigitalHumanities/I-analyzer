from indexing.models import IndexJob, TaskStatus


def is_stoppable(job: IndexJob):
    return job.status() in [TaskStatus.QUEUED, TaskStatus.WORKING]

def mark_tasks_stopped(job: IndexJob):
    '''
    Mark open tasks as aborted and queued tasks as cancelled.

    Note that this just updates the database status; the task handler must avoid
    execution.
    '''
    for task_set in job.task_query_sets():
        task_set.filter(status=TaskStatus.QUEUED).update(status=TaskStatus.CANCELLED)
        task_set.filter(status=TaskStatus.WORKING).update(status=TaskStatus.ABORTED)
