from django.db import models
from itertools import chain

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


    def __str__(self):
        return f'{self.corpus} ({self.created})'


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

    @property
    def corpus(self) -> Corpus:
        return self.job.corpus


class CreateIndexTask(IndexTask):
    '''
    Create a new index based on corpus settings.
    '''

    delete_existing = models.BooleanField(
        default=False,
        help_text='if an index by this name already exists, delete it, instead of '
            'raising an exception'
    )

    def __str__(self):
        return f'create {self.index} based on {self.corpus}'

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

    def __str__(self):
        return f'populate {self.index} based on {self.corpus}'


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

    def __str__(self):
        return f'update {self.index} based on {self.corpus}'



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

    def __str__(self):
        return f'remove alias {self.alias} from {self.index}'


class AddAliasTask(IndexTask):
    alias = models.CharField(
        max_length=128,
        help_text='alias to assign'
    )

    def __str__(self):
        return f'add alias {self.alias} to {self.index}'


class DeleteIndexTask(IndexTask):
    '''
    Delete an index.
    '''

    def __str__(self):
        return f'delete {self.index}'
