from typing import List
from csv import DictWriter
from sys import stdout

from django.core.management import BaseCommand

from indexing.models import IndexJob, TaskStatus
from indexing.run_job import perform_indexing

class Command(BaseCommand):
    help = '''
    Create, populate or clear elasticsearch indices for corpora.
    '''

    actions = ['list', 'show', 'start']

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            choices=self.actions,
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

    def handle(self, action: str, ids: List[int], **options):
        if action == 'list':
            self.list(ids)
        if action == 'show':
            for id in ids:
                self.show(id)
        if action == 'start':
            for id in ids:
                self.start(id)

    def list(self, ids: List[int]):
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

    def show(self, id: int):
        job = IndexJob.objects.get(id=id)
        print()
        print('JOB:', job.id)
        print('CORPUS:', job.corpus)
        print('CREATED ON:', job.created)
        print('STATUS:', job.status())

        print('TASKS:')
        for task in job.tasks():
            print('- ', task, f'[{task.status}]')

        print()

    def start(self, id: int):
        job = IndexJob.objects.get(id=id)

        if job.status() != TaskStatus.CREATED:
            print(
                f'Job {job.id} cannot be started: current status is {job.status()}'
            )
            return

        print(f'Starting job: {job.id}')
        perform_indexing(job)
