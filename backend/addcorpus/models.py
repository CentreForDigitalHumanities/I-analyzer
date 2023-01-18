from django.db import models
from users.models import CustomUser
from django.contrib.auth.models import Group
from django.conf import settings

class Corpus(models.Model):
    name = models.CharField(max_length=settings.MAX_LENGTH_NAME, unique=True)
    description = models.CharField(max_length=settings.MAX_LENGTH_DESCRIPTION, null=True)
    groups = models.ManyToManyField(Group, related_name='corpora', blank=True)

    class Meta:
        verbose_name_plural = 'corpora'

    def __str__(self):
        return self.name
