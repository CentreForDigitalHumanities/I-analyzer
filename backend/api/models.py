from django.db import models
from users.models import CustomUser
from addcorpus.models import Corpus

class Query(models.Model):
    query_json = models.JSONField(help_text='Search query JSON. Uses elasticseach query DSL')
    corpus = models.ForeignKey(Corpus, on_delete=models.CASCADE, to_field='name', related_name='queries')
    started = models.DateTimeField(auto_now_add=True, null = True)
    completed = models.DateTimeField(null=True)
    aborted = models.BooleanField(default=False, help_text='Whether the download was prematurely ended')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='queries')
    transferred = models.BigIntegerField(null=True,
        help_text='Number of transferred (e.g. actually downloaded) documents. Note that this does not say anything about the size of those documents.')
    total_results = models.BigIntegerField(null=True,
        help_text='Number of total results available for the query')

    class Meta:
        verbose_name_plural = 'Queries'

