from typing import List, Dict, Callable
from csv import DictWriter
from sys import stdout

from django.core.management import BaseCommand

from indexing.models import IndexJob, TaskStatus
from indexing.run_job import perform_indexing
from indexing.command_utils import run_job

class Command(BaseCommand):
    help = '''
    Create, populate or clear elasticsearch indices for corpora.
    '''

    @property
    def actions(self) -> Dict[str, Callable[[List[int]], None]]:
        return {
            'list': self.list,
            'show': self.show,
            'start': self.start,
        }

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            choices=self.actions.keys(),
            help='Action keyword. Options: '
                'list (show brief overview), show (show more information about a job, '
                'including its list of tasks); start (start a job)',
        )
        parser.add_argument(
            'ids',
            type=int,
            nargs='*',
            help='IDs of the jobs to which the action should be applied',
        )
        parser.add_argument(
            '--async',
            action='store_true',
            dest='run_async',
            help='Run job asynchronously using Celery. Only applies with "start".',
        )

    def handle(self, action: str, ids: List[int], **options):
        handle_action = self.actions[action]
        handle_action(ids, **options)

    def list(self, ids: List[int], **options):
        if len(ids):
            jobs = IndexJob.objects.filter(id__in=ids)
        else:
            jobs = IndexJob.objects.all()

        writer = DictWriter(
            fieldnames=['id', 'corpus', 'created', 'status'],
            f=stdout,
            delimiter='\t',
        )
        writer.writeheader()
        for job in jobs:
            writer.writerow({
                'id': job.id,
                'corpus': job.corpus,
                'created': job.created,
                'status': job.status()
            })

    def show(self, ids: List[int], **options):
        for id in ids:
            job = IndexJob.objects.get(id=id)
            print()
            print('JOB #', job.id, sep='')
            print('CORPUS:', job.corpus)
            print('CREATED ON:', job.created)
            print('STATUS:', job.status())

            print('TASKS:')
            for task in job.tasks():
                print('- ', task, f'[{task.status}]', sep='')

                if options['verbosity'] > 1:
                    print('    * type:', task.__class__.__name__)
                    field_values = (
                        (field.name, getattr(task, field.name))
                        for field in task._meta.fields
                    )
                    for parameter, value in field_values:
                        print('    * ', parameter, ': ', value, sep='')

            print()

    def start(self, ids: List[int], **options):
        for id in ids:
            job = IndexJob.objects.get(id=id)

            if job.status() != TaskStatus.CREATED:
                print(
                    f'Job {job.id} cannot be started: current status is {job.status()}'
                )
                return

            print(f'Starting job: {job.id}')
            run_job(job, options.get('run_async'))
