import os
import warnings

from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.constraints import UniqueConstraint

from addcorpus.constants import CATEGORIES, MappingType, VisualizationType
from addcorpus.validation.creation import (
    validate_es_mapping,
    validate_field_language,
    validate_implication,
    validate_language_code,
    validate_mimetype,
    validate_field_name_permissible_characters,
    validate_name_is_not_a_route_parameter,
    validate_ner_slug,
    validate_search_filter,
    validate_search_filter_with_mapping,
    validate_searchable_field_has_full_text_search,
    validate_sort_configuration,
    validate_visualizations_with_mapping,
    validate_source_data_directory,
)
from addcorpus.validation.indexing import (validate_essential_fields,
    validate_has_configuration, validate_language_field, validate_has_data_directory)
from addcorpus.validation.publishing import (
    validate_default_sort,
    validate_ngram_has_date_field,
)
from ianalyzer.elasticsearch import elasticsearch

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
    active = models.BooleanField(
        default=False,
        help_text='an inactive corpus is hidden from the search interface',
    )
    has_python_definition = models.BooleanField(
        default=False,
        help_text='whether the configuration of this corpus is determined by a Python '
            'module (some features are only available for Python-based corpora)',
    )
    date_created = models.DateField(
        auto_now_add=True,
        help_text='date on which the corpus was added to the database',
    )

    @property
    def configuration_obj(self) -> models.Model:
        try:
            return self.configuration
        except:
            return None

    class Meta:
        verbose_name_plural = 'corpora'

    def __str__(self):
        return self.name

    @admin.display()
    def ready_to_index(self) -> bool:
        '''
        Checks whether the corpus is ready for indexing.

        Runs a try/except around `self.validate_ready_to_index()` and returns a
        boolean; `True` means the validation completed without errors.

        If you want to see validation error messages, use the validation method
        directly.
        '''
        try:
            self.validate_ready_to_index()
            return True
        except:
            return False

    def validate_ready_to_index(self) -> None:
        '''
        Validation that should be carried out before indexing.

        Raises:
            CorpusNotIndexableError: the corpus is not meeting requirements for making
                an index.
        '''

        validate_has_configuration(self)

        config = self.configuration_obj
        fields = config.fields.all()

        validate_has_data_directory(self)
        validate_essential_fields(fields)
        validate_language_field(self)


    @admin.display()
    def ready_to_publish(self) -> bool:
        '''
        Checks whether the corpus is ready to be made public.
        '''
        try:
            self.validate_ready_to_publish()
            return True
        except:
            return False

    def validate_ready_to_publish(self) -> None:
        '''
        Validation that should be carried out before making the corpus public.

        This also includes most checks that are needed to create an index, but not all
        (if the index already exists, you do not need source data).

        Raises:
            CorpusNotIndexableError: the corpus is not meeting requirements for indexing.
            CorpusNotPublishableError: interface options are improperly configured.
        '''

        validate_has_configuration(self)

        config = self.configuration_obj
        fields = config.fields.all()

        validate_essential_fields(fields)
        validate_language_field(self)
        validate_ngram_has_date_field(self)
        validate_default_sort(self)

    def clean(self):
        if self.active:
            try:
                self.validate_ready_to_publish()
            except Exception as e:
                raise ValidationError([
                    'Corpus is set to "active" but does not meet requirements for publication.',
                    e
                ])


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
        blank=True,
        null=True
    )
    description = models.CharField(
        max_length=MAX_LENGTH_DESCRIPTION,
        blank=True,
        null=True,
        help_text='short description of the corpus',
    )
    document_context = models.JSONField(
        blank=True,
        default=dict,
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
    image = models.ImageField(
        upload_to='corpus_images',
        blank=True,
        null=True,
        help_text='image that can be used for the corpus in the interface'
    )
    languages = ArrayField(
        models.CharField(
            max_length=8,
            validators=[validate_language_code],
            blank=True,
        ),
        help_text='languages used in the content of the corpus (from most to least frequent)',
        blank=True,
    )
    min_year = models.IntegerField(
        help_text='earliest year for the data in the corpus',
    )
    max_year = models.IntegerField(
        help_text='lastest year for the data in the corpus',
    )
    scan_image_type = models.CharField(
        max_length=64,
        blank=True,
        validators=[validate_mimetype],
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
    default_sort = models.JSONField(
        blank=True,
        validators=[validate_sort_configuration],
        default=dict,
        help_text='default sort for search results without query text; '
            'if blank, results are presented in the order in which they are stored',
    )
    language_field = models.CharField(
        blank=True,
        help_text='name of the field that specifies the language of documents (if any);'
            'required to use "dynamic" language on fields',
    )
    data_directory = models.CharField(
        max_length=200,
        validators=[validate_source_data_directory],
        blank=True,
        help_text='path to directory containing source data files',
    )
    source_data_delimiter = models.CharField(
        max_length=1,
        choices=[
            (',','comma'),
            (';','semicolon'),
            ('\t','tab')
        ],
        blank=True,
        help_text='delimiter used in (CSV) source data files',
    )

    def __str__(self):
        return f'Configuration of <{self.corpus.name}>'

    def clean(self):
        if self.corpus.active:
            try:
                self.corpus.validate_ready_to_publish()
            except Exception as e:
                raise ValidationError([
                    'Corpus configuration is not valid for an active corpus. Deactivate '
                    'the corpus or correct the following errors.',
                    e
                ])

    @property
    def has_named_entities(self):
        from es.search import total_hits

        client = elasticsearch(self.corpus.name)
        try:
            # we check if any fields exist for filtering named entities
            ner_exists = client.search(
                index=self.es_index, query={"exists": {"field": "*:ner-kw"}}, size=0
            )
            if total_hits(ner_exists):
                return True
        except:
            return False
        return False


FIELD_DISPLAY_TYPES = [
    ('text_content', 'text content'),
    (MappingType.TEXT.value, 'text'),
    (MappingType.KEYWORD.value, 'keyword'),
    (MappingType.DATE.value, 'date'),
    (MappingType.DATE_RANGE.value, 'date_range'),
    (MappingType.INTEGER.value, 'integer'),
    (MappingType.FLOAT.value, 'float'),
    (MappingType.BOOLEAN.value, 'boolean'),
    (MappingType.GEO_POINT.value, 'geo_point'),
    ('url', 'url'),
]

FIELD_VISUALIZATIONS = [
    (VisualizationType.RESULTS_COUNT.value, 'Number of results'),
    (VisualizationType.TERM_FREQUENCY.value, 'Frequency of the search term'),
    (VisualizationType.NGRAM.value, 'Neighbouring words'),
    (VisualizationType.WORDCLOUD.value, 'Most frequent words'),
    (VisualizationType.MAP.value, 'Map of geo-coordinates'),
]
'''Options for `visualizations` field'''

VISUALIZATION_SORT_OPTIONS = [
    ('key', 'By the value of the field'),
    ('value', 'By frequency')
]
'''Options for `visualization_sort` field'''


class Field(models.Model):
    name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        validators=[
            validate_name_is_not_a_route_parameter,
            validate_field_name_permissible_characters,
        ],
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
        validators=[validate_search_filter],
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
        validators=[validate_es_mapping],
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
    searchable = models.BooleanField(
        default=False,
        help_text='whether this field is listed when selecting search fields',
    )
    downloadable = models.BooleanField(
        default=True,
        help_text='whether this field can be included in search results downloads',
    )
    language = models.CharField(
        max_length=64,
        blank=True,
        validators=[validate_field_language],
        help_text='specification for the language of this field; can be blank, an IETF '
            'tag, or "dynamic"; "dynamic" means the language is determined by the '
            'language_field of the corpus configuration',
    )
    extract_column = models.CharField(
        max_length=64,
        blank=True,
        help_text='column name in CSV source files from which to extract this field',
    )
    position = models.IntegerField(
        null=True,
        blank=True,
        help_text="Field's position within the configuration (order)"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['corpus_configuration', 'name'],
                                name='unique_name_for_corpus')
        ]
        ordering = ["position"]

    @property
    def is_main_content(self) -> bool:
        return self.display_type == 'text_content'

    def __str__(self) -> str:
        return f'{self.name} ({self.corpus_configuration.corpus.name})'

    def clean(self):
        validate_searchable_field_has_full_text_search(self.es_mapping, self.searchable)
        validate_ner_slug(self.es_mapping, self.name)

        if self.search_filter:
            validate_search_filter_with_mapping(self.es_mapping, self.search_filter)

        if self.visualizations:
            validate_visualizations_with_mapping(self.es_mapping, self.visualizations)

        validate_implication(self.csv_core, self.downloadable, "Core download fields must be downloadable")

        # core search fields must searchable
        # not a hard requirement because it is not currently satisfied in all corpora
        try:
            validate_implication(self.search_field_core, self.searchable, "Core search fields must be searchable")
        except ValidationError as e:
            warnings.warn(e.message)

        if self.corpus_configuration.corpus.active:
            try:
                self.corpus_configuration.corpus.validate_ready_to_publish()
            except Exception as e:
                raise ValidationError([
                    'Field configuration is not valid in an active corpus. Deactivate '
                    'the corpus or correct the following errors.',
                    e
                ])


class CorpusDocumentationPage(models.Model):
    class PageType(models.TextChoices):
        GENERAL = ('general', 'General information')
        CITATION = ('citation', 'Citation')
        LICENSE = ('license', 'License')
        TERMS_OF_SERVICE = ('terms_of_service', 'Terms of service')
        WORDMODELS = ('wordmodels', 'Word models')

    corpus_configuration = models.ForeignKey(
        to=CorpusConfiguration,
        related_name='documentation_pages',
        help_text='configuration that this page documents',
        on_delete=models.CASCADE,
    )
    type = models.CharField(
        max_length=16,
        choices=PageType.choices,
        default='general',
        help_text='the type of documentation'
    )
    content = models.TextField(
        help_text='markdown contents of the documentation'
    )

    @property
    def page_index(self):
        '''Numerical index to determine the order in which pages should be displayed.
        Based on the order in which `PageType` choices are declared.'''
        indexed_values = enumerate(__class__.PageType.values)
        return next((i for (i, value) in indexed_values if value == self.type), None)

    def __str__(self):
        return f'{self.corpus_configuration.corpus.name} - {self.type}'

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=['corpus_configuration', 'type'],
                name='unique_documentation_type_for_corpus'
            )
        ]


class CorpusDataFile(models.Model):
    def upload_path(self, filename):
        return os.path.join('corpus_datafiles', f'{self.corpus.pk}', filename)

    corpus = models.ForeignKey(to=Corpus, on_delete=models.CASCADE)
    file = models.FileField(upload_to=upload_path,
                            help_text='file containing corpus data')
    is_sample = models.BooleanField(
        default=False, help_text='This file is used in creating the corpus definition, it may additonaly reflect (part of) the actual data.')
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.file.name}'
