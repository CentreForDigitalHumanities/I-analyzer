from django.db import models
from users.models import CustomUser
from addcorpus.models import Corpus
from django.conf import settings

class Download(models.Model):
    started = models.DateTimeField(auto_now_add=True)
    completed = models.DateTimeField(null=True)
    download_type = models.CharField(max_length=settings.MAX_LENGTH_NAME,
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
    filename = models.FilePathField(path=settings.CSV_FILES_PATH,
        max_length=settings.MAX_LENGTH_FILENAME, null=True,
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
