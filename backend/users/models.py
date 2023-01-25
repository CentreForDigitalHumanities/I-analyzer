from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class CustomUser(AbstractUser):
    saml = models.BooleanField(blank=True, null=True, default=False)
    download_limit = models.IntegerField(
        help_text='Maximum documents that this user can download per query',
        default=settings.DEFAULT_DOWNLOAD_LIMIT)

    def has_access(self, corpus_name):
        # superusers automatically have access to all corpora
        if self.is_superuser:
            return True

        # check if any corpus added to the user's group(s) match the corpus name
        return any(corpus for group in self.groups.all() for corpus in group.corpora.filter(name=corpus_name))

