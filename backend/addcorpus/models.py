from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import Group

from addcorpus.constants import CATEGORIES
from addcorpus.validators import validate_language_code

MAX_LENGTH_NAME = 126
MAX_LENGTH_DESCRIPTION = 254
MAX_LENGTH_TITLE = 256

class Corpus(models.Model):
    name = models.SlugField(
        max_length=MAX_LENGTH_NAME,
        unique=True,
        help_text='internal name of the corpus',
    )
    groups = models.ManyToManyField(
        Group,
        related_name='corpora',
        blank=True,
        help_text='groups that have access to this corpus',
    )

    @property
    def active(self):
        try:
            self.configuration
            return True
        except:
            return False

    class Meta:
        verbose_name_plural = 'corpora'

    def __str__(self):
        return self.name

class CorpusConfiguration(models.Model):
    '''
    The configuration of the corpus as set by the definition file.

    Corpora require a CorpusConfiguration to function, but while the
    Corpus object should be preserved as a reference point for relationships,
    the CorpusConfiguration can safely be removed and re-initialised when
    parsing corpus definitions.
    '''

    corpus = models.OneToOneField(
        to=Corpus,
        on_delete=models.CASCADE,
        related_name='configuration',
    )
    allow_image_download = models.BooleanField(
        default=False,
        help_text='whether users can download document scans',
    )
    category = models.CharField(
        max_length=64,
        choices=CATEGORIES,
        help_text='category/medium of documents in this dataset',
    )
    description_page = models.CharField(
        max_length=128,
        blank=True,
        help_text='filename of the markdown documentation file for this corpus',
    )
    description = models.CharField(
        max_length=MAX_LENGTH_DESCRIPTION,
        blank=True,
        help_text='short description of the corpus',
    )
    document_context = models.JSONField(
        null=True,
        help_text='specification of how documents are grouped into collections',
    )
    es_alias = models.SlugField(
        max_length=MAX_LENGTH_NAME,
        blank=True,
        help_text='alias assigned to the corpus index in elasticsearch',
    )
    es_index = models.SlugField(
        max_length=MAX_LENGTH_NAME,
        help_text='name of the corpus index in elasticsearch'
    )
    image = models.CharField(
        max_length=126,
        help_text='filename of the corpus image',
    )
    languages = ArrayField(
        models.CharField(
            max_length=8,
            validators=[validate_language_code],
            blank=True,
        ),
        help_text='languages used in the content of the corpus (from most to least frequent)',
    )
    min_date = models.DateField(
        help_text='earliest date for the data in the corpus',
    )
    max_date = models.DateField(
        help_text='latest date for the data in the corpus',
    )
    scan_image_type = models.CharField(
        max_length=64,
        blank=True,
        help_text='MIME type of scan images',
    )
    title = models.CharField(
        max_length=MAX_LENGTH_TITLE,
        help_text='title of the corpus in the interface',
    )
    word_models_present = models.BooleanField(
        default=False,
        help_text='whether this corpus has word models',
    )

    def __str__(self):
        return f'Configuration of <{self.corpus.name}>'

FIELD_DISPLAY_TYPES = [
    ('text_content', 'text content'),
    ('text', 'text'),
    ('keyword', 'keyword'),
    ('date', 'date'),
    ('integer', 'integer'),
    ('float', 'float'),
    ('boolean', 'boolean'),
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
    corpus_configuration = models.ForeignKey(
        to=CorpusConfiguration,
        on_delete=models.CASCADE,
        related_name='fields',
        help_text='corpus configuration that this field belongs to',
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
        blank=True,
        help_text='explanatory text to be shown in the interface',
    )
    search_filter = models.JSONField(
        blank=True,
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
        blank=True,
        default=list,
        help_text='visualisations for this field',
    )
    visualization_sort = models.CharField(
        max_length=8,
        choices=VISUALIZATION_SORT_OPTIONS,
        blank=True,
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
            models.UniqueConstraint(fields=['corpus_configuration', 'name'],
                                name='unique_name_for_corpus')
        ]

    def __str__(self) -> str:
        return f'{self.name} ({self.corpus_configuration.corpus.name})'
