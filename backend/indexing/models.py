from django.db import models

from addcorpus.models import Corpus
from es.models import Index

class IndexJob(models.Model):
    corpus = models.ForeignKey(
        to=Corpus,
        on_delete=models.CASCADE,
        help_text='corpus for which the job is created; task may use the corpus '
            'to determine metadata or extract documents',
    )
    created = models.DateTimeField(
        auto_now_add=True,
    )

class IndexTask(models.Model):
    class Meta:
        abstract = True

    job = models.ForeignKey(
        to=IndexJob,
        on_delete=models.CASCADE,
        related_name='%(class)ss',
        help_text='job in which this task is run',
    )
    index = models.ForeignKey(
        to=Index,
        on_delete=models.CASCADE,
        related_name='%(class)ss',
        help_text='index on which this task is applied',
    )


class CreateIndexTask(IndexTask):
    '''
    Create a new index based on corpus settings.
    '''

    delete_existing = models.BooleanField(
        default=False,
        help_text='if an index by this name already exists, delete it, instead of '
            'raising an exception'
    )

class PopulateIndexTask(IndexTask):
    '''
    Extract documents from a corpus and add them to the index.
    '''

    document_min_date = models.DateField(
        blank=True,
        null=True,
        help_text='minimum date on which to filter documents'
    )
    document_max_date = models.DateField(
        blank=True,
        null=True,
        help_text='maximum date on which to filter documents'
    )


class UpdateIndexTask(IndexTask):
    '''
    Run an update script; usually to add/change field values in existing documents.

    Only available for corpora with a Python definition (which must also include a method
    that defines such a script).
    '''

    document_min_date = models.DateField(
        blank=True,
        null=True,
        help_text='minimum date on which to filter documents'
    )
    document_max_date = models.DateField(
        blank=True,
        null=True,
        help_text='maximum date on which to filter documents'
    )


class UpdateSettingsTask(IndexTask):
    '''
    Push new settings to an index
    '''

    settings = models.JSONField(
        blank=True,
        default=dict,
    )

    def __str__(self):
        return f'update settings of {self.index}'


class RemoveAliasTask(IndexTask):
    alias = models.CharField(
        max_length=128,
        help_text='alias to remove'
    )


class AddAliasTask(IndexTask):
    alias = models.CharField(
        max_length=128,
        help_text='alias to assign'
    )


class DeleteIndexTask(IndexTask):
    '''
    Delete an index.
    '''
