from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class CustomUser(AbstractUser):
    saml = models.BooleanField(blank=True, null=True, default=False)
    download_limit = models.IntegerField(
        help_text='Maximum documents that this user can download per query',
        default=settings.DEFAULT_DOWNLOAD_LIMIT)

    def has_access(self, corpus_name):
        group_has_access = lambda group: any(corpus.name == corpus_name for corpus in group.corpora.all())
        return any(group_has_access(group) for group in self.groups.all())
