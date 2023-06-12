from django.db import models
from django.core.validators import MaxLengthValidator

from addcorpus.models import Corpus
from users.models import CustomUser

DOCS_PER_TAG_LIMIT = 100

class Tag(models.Model):
    name = models.CharField(blank=False, null=False, max_length=512)
    description = models.TextField(blank=True, null=False)
    user = models.ForeignKey(
        to=CustomUser,
        related_name='tags',
        on_delete=models.CASCADE,
        null=False,
    )

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
    document_ids = models.JSONField(
        default=list,
        null=False,
        validators=[MaxLengthValidator(DOCS_PER_TAG_LIMIT)],
    )
