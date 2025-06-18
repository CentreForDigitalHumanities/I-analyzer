from django.core.management import BaseCommand

from addcorpus.models import Corpus
from indexing.create_job import create_alias_job
from indexing.command_utils import run_job, add_create_only_argument, add_async_argument

class Command(BaseCommand):
    help = '''
    Ensure that an alias exist for the index with the highest version number (e.g.
    `indexname-5`). The alias is removed for all other (lower / older) versions. The
    indices themselves are only removed if you add the `--clean` flag (but be very sure
    if this is what you want to do!). Particularly useful in the production environment,
    i.e. after creating an index with `--prod`.
    '''

    def add_arguments(self, parser):
        parser.add_argument(
            'corpus',
            help='''Corpus for which the alias should be updated. This should match the
                "name" field in the database. For Python corpora, this field is based on
                the name in settings.py'''
        )

        parser.add_argument(
            '--clean',
            action='store_true',
            help='''If included, any indices that are not the highest version will be
                deleted.'''
        )

        add_create_only_argument(parser)
        add_async_argument(parser, 'Cannot be used in combination with --create-only.')


    def handle(self, corpus, clean=False, create_only=False, run_async=False, **options):
        corpus_obj = Corpus.objects.get(name=corpus)
        job = create_alias_job(corpus_obj, clean)

        if not create_only:
            run_job(job, run_async)
