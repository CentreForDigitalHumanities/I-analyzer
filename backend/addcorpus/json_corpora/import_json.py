from typing import Dict, Iterable, Optional
from datetime import datetime


from addcorpus.models import Corpus, CorpusConfiguration, Field
from addcorpus.json_corpora.utils import get_path
from addcorpus import es_mappings
from addcorpus.constants import VisualizationType
from addcorpus.validation.publishing import _any_date_fields
from django.conf import settings
from addcorpus.json_corpora.constants import DEFAULT_CSV_DELIMITER, DATE_FORMAT

def import_json_corpus(data: Dict) -> Corpus:
    name = get_path(data, 'name')

    corpus, _created = Corpus.objects.get_or_create(name=name)

    # create a clean CorpusConfiguration object, but use the existing PK if possible
    pk = corpus.configuration_obj.pk if corpus.configuration_obj else None
    configuration = CorpusConfiguration(pk=pk, corpus=corpus)
    configuration = _parse_configuration(data, configuration)
    configuration.save()
    configuration.full_clean()

    _import_fields(data, configuration)

    return corpus


def create_index_name(corpus_name: str) -> str:
    prefix = settings.SERVERS['default'].get('index_prefix', None)
    if prefix:
        return f'{prefix}-{corpus_name}'
    return corpus_name


def _parse_configuration(data: Dict, configuration: CorpusConfiguration) -> CorpusConfiguration:
    configuration.title = get_path(data, 'meta', 'title')
    configuration.description = get_path(data, 'meta', 'description')
    configuration.category = get_path(data, 'meta', 'category')
    configuration.es_index = create_index_name(get_path(data, 'name'))
    configuration.languages = get_path(data, 'meta', 'languages')
    configuration.min_date = _parse_date(
        get_path(data, 'meta', 'date_range', 'min'))
    configuration.max_date = _parse_date(
        get_path(data, 'meta', 'date_range', 'max'))
    configuration.default_sort = get_path(
        data, 'options', 'default_sort') or {}
    configuration.language_field = get_path(
        data, 'options', 'language_field') or ''
    configuration.document_context = get_path(
        data, 'options', 'document_context') or {}
    configuration.source_data_delimiter = get_path(
        data, 'source_data', 'options', 'delimiter') or DEFAULT_CSV_DELIMITER
    return configuration


def _parse_date(date: str):
    return datetime.strptime(date, DATE_FORMAT).date()


def _import_fields(data: Dict, configuration: CorpusConfiguration) -> None:
    fields_data = get_path(data, 'fields')

    for field_data in fields_data:
        field = _parse_field(field_data, configuration)
        field.save()
        field.full_clean()

    for field in configuration.fields.exclude(name__in=(f['name'] for f in fields_data)):
        field.delete()

    _include_ngram_visualisation(configuration.fields.all())


def _field_pk(name: str, configuration: CorpusConfiguration):
    try:
        return Field.objects.get(corpus_configuration=configuration, name=name).pk
    except Field.DoesNotExist:
        return None


def _parse_field(field_data: Dict, configuration: Optional[CorpusConfiguration] = None) -> Field:
    name = get_path(field_data, 'name')
    display_name = get_path(field_data, 'display_name')
    description = get_path(field_data, 'description')
    results_overview = get_path(field_data, 'options', 'preview')
    hidden = get_path(field_data, 'options', 'hidden')
    extract_column = get_path(field_data, 'extract', 'column')

    field = Field(
        pk=_field_pk(name, configuration) if configuration else None,
        corpus_configuration=configuration,
        name=name,
        display_name=display_name,
        description=description,
        results_overview=results_overview,
        hidden=hidden,
        csv_core=results_overview,
        extract_column=extract_column,
    )

    field_type = get_path(field_data, 'type')
    parsers = {
        'text_content': _parse_text_content_field,
        'text_metadata': _parse_text_metadata_field,
        'url': _parse_url_field,
        'integer': _parse_numeric_field,
        'float': _parse_numeric_field,
        'date': _parse_date_field,
        'boolean': _parse_boolean_field,
        'geo_json': _parse_geo_field,
    }
    field = parsers[field_type](field, field_data)

    return field



def _parse_text_content_field(field: Field, field_data: Dict) -> Field:
    language = _parse_language(field_data)
    has_single_language = language and language != 'dynamic'

    field.es_mapping = es_mappings.main_content_mapping(
        token_counts=True,
        stopword_analysis=has_single_language,
        stemming_analysis=has_single_language,
        language=language if has_single_language else None,
    )
    field.language = language
    field.display_type = 'text_content'
    field.search_filter = {}
    field.searchable = True
    field.search_field_core = True

    visualize = get_path(field_data, 'options', 'visualize')
    if visualize:
        field.visualizations = [
            VisualizationType.WORDCLOUD.value
        ]

    return field


def _parse_text_metadata_field(field: Field, field_data: Dict) -> Field:
    searchable = get_path(field_data, 'options', 'search')
    filter_setting = get_path(field_data, 'options', 'filter')
    filterable = filter_setting != 'none'
    sortable = get_path(field_data, 'options', 'sort')
    visualize = get_path(field_data, 'options', 'visualize')

    field.language = _parse_language(field_data)

    if searchable and not (sortable or filterable):
        field.es_mapping = es_mappings.text_mapping()
        field.display_type = 'text'
        field.search_filter = {}
        field.searchable = True
        if visualize:
            field.visualizations = [
                VisualizationType.WORDCLOUD.value
            ]
    else:
        field.es_mapping = es_mappings.keyword_mapping(
            enable_full_text_search=searchable
        )
        field.display_type = 'keyword'
        if filter_setting == 'show':
            field.search_filter = {
                'name': 'MultipleChoiceFilter',
                'description': f'Select results based on {field.display_name}',
            }
        else:
            field.search_filter = {}
        field.searchable = searchable
        field.sortable = sortable
        if visualize:
            field.visualizations = [
                VisualizationType.RESULTS_COUNT.value,
                VisualizationType.TERM_FREQUENCY.value,
            ]

    return field


def _parse_language(field_data: Dict) -> str:
    return get_path(field_data, 'language') or ''


def _parse_url_field(field: Field, field_data: Dict) -> Field:
    field.es_mapping = es_mappings.keyword_mapping()
    field.display_type = 'url'
    field.search_filter = {}
    return field


def _parse_numeric_field(field: Field, field_data: Dict) -> Field:
    field.display_type = get_path(field_data, 'type')

    if field.display_type == 'integer':
        field.es_mapping = es_mappings.int_mapping()
    else:
        field.es_mapping = es_mappings.float_mapping()

    field.sortable = get_path(field_data, 'options', 'sort')

    filter_setting = get_path(field_data, 'options', 'filter')
    if filter_setting == 'show':
        field.search_filter = {
            'name': 'RangeFilter',
            'description': f'Select results based on {field.display_name}',
        }
    else:
        field.search_filter = {}

    visualize = get_path(field_data, 'options', 'visualize')
    if visualize:
        field.visualizations = [
            VisualizationType.RESULTS_COUNT.value,
            VisualizationType.TERM_FREQUENCY.value
        ]
        field.visualization_sort = 'key'
    return field


def _parse_date_field(field: Field, field_data: Dict) -> Field:
    field.display_type = 'date'
    field.es_mapping = es_mappings.date_mapping()
    field.sortable = get_path(field_data, 'options', 'sort')
    filter_setting = get_path(field_data, 'options', 'filter')

    if filter_setting == 'show':
        field.search_filter = {
            'name': 'DateFilter',
            'description': f'Select results based on {field.display_name}',
        }
    else:
        field.search_filter = {}

    visualize = get_path(field_data, 'options', 'visualize')
    if visualize:
        field.visualizations = [
            VisualizationType.RESULTS_COUNT.value,
            VisualizationType.TERM_FREQUENCY.value
        ]
    return field


def _parse_boolean_field(field: Field, field_data: Dict) -> Field:
    field.display_type = 'boolean'
    field.es_mapping = es_mappings.bool_mapping()
    filter_setting = get_path(field_data, 'options', 'filter')

    if filter_setting == 'show':
        field.search_filter = {
            'name': 'BooleanFilter',
            'description': f'Select results based on {field.display_name}',
        }
    else:
        field.search_filter = {}

    visualize = get_path(field_data, 'options', 'visualize')
    if visualize:
        field.visualizations = [
            VisualizationType.RESULTS_COUNT.value,
            VisualizationType.TERM_FREQUENCY.value
        ]
    return field


def _parse_geo_field(field: Field, field_data: Dict) -> Field:
    field.display_type = 'keyword'
    field.es_mapping = es_mappings.geo_mapping()
    field.search_filter = {}
    return field


def _include_ngram_visualisation(fields: Iterable[Field]):
    '''
    Check if the ngram visualisation can be included and add it if possible.

    This can't be done in the initial parse because you have to check if a date
    field is present.
    '''

    if _any_date_fields(fields):
        for field in fields:
            if field.display_type == 'text_content':
                field.visualizations.append(VisualizationType.NGRAM.value)
                field.save()
