from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import Group

MAX_LENGTH_NAME = 126
MAX_LENGTH_DESCRIPTION = 254
MAX_LENGTH_TITLE = 256

class Corpus(models.Model):
    name = models.CharField(max_length=MAX_LENGTH_NAME, unique=True)
    description = models.CharField(max_length=MAX_LENGTH_DESCRIPTION, null=True)
    groups = models.ManyToManyField(Group, related_name='corpora', blank=True)

    class Meta:
        verbose_name_plural = 'corpora'

    def __str__(self):
        return self.name


FIELD_DISPLAY_TYPES = [
    ('text_content', 'text content'),
    ('text', 'text'),
    ('keyword', 'keyword'),
    ('date', 'date'),
    ('integer', 'integer'),
    ('float', 'float')
]

FIELD_VISUALIZATIONS = [
    ('resultscount', 'Number of results'),
    ('termfrequency', 'Frequency of the search term'),
    ('ngram', 'Neighbouring words'),
    ('wordcloud', 'Most frequent words'),
]

VISUALIZATION_SORT_OPTIONS = [
    ('key', 'By the value of the field'),
    ('value', 'By frequency')
]

class Field(models.Model):
    name = models.SlugField(
        max_length=MAX_LENGTH_NAME,
        help_text='internal name for the field',
    )
    corpus = models.ForeignKey(
        to=Corpus,
        on_delete=models.CASCADE,
        related_name='fields',
        help_text='corpus that this field belongs to',
    )
    display_name = models.CharField(
        max_length=MAX_LENGTH_TITLE,
        help_text='name that is displayed in the interface',
    )
    display_type = models.CharField(
        max_length=16,
        choices=FIELD_DISPLAY_TYPES,
        help_text='as what type of data this field is rendered in the interface',
    )
    description = models.CharField(
        max_length=MAX_LENGTH_DESCRIPTION,
        null=True,
        help_text='explanatory text to be shown in the interface',
    )
    search_filter = models.JSONField(
        null=True,
        help_text='specification of the search filter for this field (if any)',
    )
    results_overview = models.BooleanField(
        default=False,
        help_text='whether this field is shown in document previews in search results',
    )
    csv_core = models.BooleanField(
        default=False,
        help_text='whether this field is included in search results downloads by default',
    )
    search_field_core = models.BooleanField(
        default=False,
        help_text='whether this field is pre-selected when choosing search fields',
    )
    visualizations = ArrayField(
            models.CharField(
            max_length=16,
            choices=FIELD_VISUALIZATIONS,
        ),
        null=True,
        help_text='visualisations for this field',
    )
    visualization_sort = models.CharField(
        max_length=8,
        choices=VISUALIZATION_SORT_OPTIONS,
        null=True,
        help_text='if the field has results/term frequency charts: how is the x-axis sorted?',
    )
    es_mapping = models.JSONField(
        help_text='specification of the elasticsearch mapping of this field',
    )
    indexed = models.BooleanField(
        default=True,
        help_text='whether this field is indexed in elasticsearch',
    )
    hidden = models.BooleanField(
        default=False,
        help_text='whether this field is hidden in the interface',
    )
    required = models.BooleanField(
        default=False,
        help_text='whether this field is required',
    )
    sortable = models.BooleanField(
        default=False,
        help_text='whether search results can be sorted on this field',
    )
    primary_sort = models.BooleanField(
        default=False,
        help_text='if sortable: whether this is the default method of sorting search results',
    )
    searchable = models.BooleanField(
        default=False,
        help_text='whether this field is listed when selecting search fields',
    )
    downloadable = models.BooleanField(
        default=True,
        help_text='whether this field can be included in search results downloads',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['corpus', 'name'],
                                name='unique_name_for_corpus')
        ]

    def __str__(self) -> str:
        return f'{self.name} ({self.corpus.name})'
