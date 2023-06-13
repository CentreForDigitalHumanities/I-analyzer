from django.db import models
from django.db.models.constraints import UniqueConstraint
from django.contrib.postgres.fields import ArrayField

from addcorpus.models import Corpus
from django.conf import settings

DOCS_PER_TAG_LIMIT = 500

class Tag(models.Model):
    name = models.CharField(blank=False, null=False, max_length=512)
    description = models.TextField(blank=True, null=False)
    user = models.ForeignKey(
        to=settings.AUTH_USER_MODEL,
        related_name='tags',
        on_delete=models.CASCADE,
        null=False,
    )

    class Meta:
        constraints = [
            UniqueConstraint(fields=['user', 'name'], name='unique_name_for_user')
        ]

class TagInstance(models.Model):
    tag = models.ForeignKey(
        to=Tag,
        related_name='instances',
        on_delete=models.CASCADE,
        null=False
    )
    corpus = models.ForeignKey(
        to=Corpus,
        on_delete=models.CASCADE,
        to_field='name',
        related_name='tag_instances',
    )
    document_ids = ArrayField(
        models.CharField(
            blank=False,
            null=False,
            max_length=512,
        ),
        default=list,
        null=False,
        size=DOCS_PER_TAG_LIMIT,
    )
