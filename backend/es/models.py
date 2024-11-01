from django.db import models
from addcorpus import models as corpus_models

class Index(models.Model):
    name = models.CharField(
        max_length=corpus_models.MAX_LENGTH_NAME + 8,
        help_text='name of the index in elasticsearch (including version number)'
    )
    server = models.CharField(
        default='default',
        help_text='key of the elasticsearch server in the project settings'
    )
    available = models.BooleanField(
        help_text='whether the index is currently available on elasticsearch',
        default=True,
    )


