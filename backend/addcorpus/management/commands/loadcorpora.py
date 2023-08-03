from django.core.management.base import BaseCommand, CommandError
from addcorpus.load_corpus import load_all_corpora

class Command(BaseCommand):
    help = '''
    Load all python corpus definitions (configured in settings)
    into the database
    '''

    def handle(self, *args, **kwargs):
        load_all_corpora()
        self.stdout.write('Finished loading corpora')
