from django.core.management.base import BaseCommand
from addcorpus.save_corpus import load_and_save_all_corpora

class Command(BaseCommand):
    help = '''
    Load all python corpus definitions (configured in settings)
    into the database
    '''

    def handle(self, *args, **kwargs):
        load_and_save_all_corpora()
        self.stdout.write('Finished loading corpora')
