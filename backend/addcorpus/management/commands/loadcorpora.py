from django.core.management.base import BaseCommand
from addcorpus.python_corpora.save_corpus import load_and_save_all_corpora

class Command(BaseCommand):
    help = '''
    Load all python corpus definitions (configured in settings)
    into the database.

    This command will add any newly added corpora to the database,
    and update any existing corpora.

    If a corpus is removed from settings or cannot be successfully
    loaded, it will not be removed from the database, to prevent data
    loss.
    '''

    def handle(self, *args, **kwargs):
        verbosity = kwargs['verbosity']
        self.stdout.ending = '' # make format compatible with sys.stdout
        self.stderr.ending = ''

        load_and_save_all_corpora(
            verbose=verbosity > 1,
            stdout=self.stdout,
            stderr=self.stderr
        )

        self.stdout.write('Finished loading corpora', ending='\n')
