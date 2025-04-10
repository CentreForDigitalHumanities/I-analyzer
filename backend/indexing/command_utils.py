'''
Shared functions for django-admin commands
'''

from argparse import ArgumentParser

from indexing.models import IndexJob
from indexing.run_job import perform_indexing, perform_indexing_async, mark_tasks_stopped

def add_create_only_argument(parser: ArgumentParser) -> None:
    parser.add_argument(
        '--create-only',
        action='store_true',
        help='''Save an IndexJob for this command, but don't run it.'''
    )

def add_async_argument(parser: ArgumentParser, extra_help: str = '') -> None:
    parser.add_argument(
        '--async',
        action='store_true',
        dest='run_async', # "async" is a Python keyword
        help=f'Run job asynchronously using Celery. {extra_help}',
    )


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
