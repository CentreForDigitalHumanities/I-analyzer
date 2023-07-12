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

    @property
    def count(self):
        return len(self.tagged_docs.all())


    def __str__(self):
        return f'Tag #{self.id}: "{self.name}" by {self.user.username}'

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
