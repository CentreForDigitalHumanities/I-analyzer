from django.db import models
from users.models import CustomUser
from addcorpus.models import Corpus
from django.conf import settings

class Query(models.Model):
    query_json = models.JSONField()
    corpus = models.ForeignKey(Corpus, on_delete=models.CASCADE, to_field='name', related_name='queries')
    started = models.DateTimeField(auto_now_add=True)
    completed = models.DateTimeField(null=True)
    aborted = models.BooleanField(null=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='queries')
    transferred = models.BigIntegerField(null=True)
    total_results = models.BigIntegerField(null=True)

    class Meta:
        verbose_name_plural = 'Queries'

class Download(models.Model):
    started = models.DateTimeField(auto_now_add=True)
    completed = models.DateTimeField(null=True)
    download_type = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    corpus = models.ForeignKey(Corpus, on_delete=models.CASCADE, to_field='name', related_name='downloads')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='downloads')
    parameters = models.JSONField()
    filename = models.FilePathField(path=settings.CSV_FILES_PATH, max_length=settings.MAX_LENGTH_FILENAME, null=True)

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
