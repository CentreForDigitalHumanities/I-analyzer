from addcorpus.models import Corpus
from django.conf import settings
from django.db import models
from django.db.models.constraints import UniqueConstraint

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
            UniqueConstraint(fields=['user', 'name'],
                             name='unique_name_for_user')
        ]


class TaggedDocument(models.Model):
    doc_id = models.CharField(max_length=512)
    corpus = models.ForeignKey(
        to=Corpus,
        to_field='name',
        related_name='tagged_docs',
        on_delete=models.CASCADE
    )
    tags = models.ManyToManyField(
        to=Tag,
        related_name='tagged_docs'
    )
