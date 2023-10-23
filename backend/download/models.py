from django.db import models
from users.models import CustomUser
from addcorpus.models import Corpus
from django.conf import settings
from datetime import datetime

MAX_LENGTH_FILENAME = 254

def csv_directory():
    return settings.CSV_FILES_PATH

class Download(models.Model):
    started = models.DateTimeField(auto_now_add=True)
    completed = models.DateTimeField(null=True)
    download_type = models.CharField(max_length=126,
        choices=[
            ('search_results', 'Search results'),
            ('date_term_frequency', 'Term frequency (timeline)'),
            ('aggregate_term_frequency', 'Term frequency (histogram)'),
        ],
        help_text='Type of download (search results or a type of visualisation)')
    corpus = models.ForeignKey(Corpus, on_delete=models.CASCADE, to_field='name', related_name='downloads')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='downloads')
    parameters = models.JSONField(
        help_text='JSON parameters for the download request that was made to the backend'
    )
    filename = models.FilePathField(path=csv_directory,
        max_length=MAX_LENGTH_FILENAME, null=True,
        help_text='Path to the assembled CSV file'
    )

    @property
    def is_done(self):
        return self.completed != None

    @property
    def status(self):
        if self.is_done and self.filename:
            return 'done'
        elif self.is_done:
            return 'error'
        else:
            return 'working'

    def complete(self, filename = None):
        '''
        Mark a download as completed.
        If no filename is provided, the download will get 'error' status.
        '''

        self.filename = filename
        self.completed = datetime.now()
        self.save()

    def descriptive_filename(self):
        corpus_name = self.corpus.name
        type_name = self.download_type
        timestamp = self.completed.strftime('%Y-%m-%d %H:%M')

        return f'{type_name}__{corpus_name}__{timestamp}.csv'
