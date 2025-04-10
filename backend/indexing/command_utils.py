'''
Shared functions for django-admin commands
'''

from indexing.models import IndexJob
from indexing.run_job import perform_indexing, perform_indexing_async, mark_tasks_stopped


def run_job(job: IndexJob, run_async: bool):
    if run_async:
        perform_indexing_async(job)
        print('Job scheduled.')
    else:
        try:
            perform_indexing(job)
        except KeyboardInterrupt as e:
            print('Aborting tasks...')
            mark_tasks_stopped(job)
