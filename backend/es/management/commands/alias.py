from django.core.management import BaseCommand

from addcorpus.load_corpus import load_corpus
from es.es_alias import alias

class Command(BaseCommand):
    help = '''
    Ensure that an alias exist for the index with the highest version number (e.g. `indexname_5`).
    The alias is removed for all other (lower / older) versions. The indices themselves are only removed
    if you add the `--clean` flag (but be very sure if this is what you want to do!).
    Particularly useful in the production environment, i.e. after creating an index with `--prod`.

    '''

    def add_arguments(self, parser):
        parser.add_argument(
            'corpus',
            help='Corpus for which the alias should be updated. Use the name from settings.py'
        )

        parser.add_argument(
            '--clean',
            action='store_true',
            help='''If included, any indices that are not the highest version will be deleted'''
        )

    def handle(self, corpus, clean=False, **options):
        corpus_definition = load_corpus(corpus)
        alias(corpus, corpus_definition, clean)
