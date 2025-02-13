from typing import Dict
from addcorpus.models import Corpus, CorpusConfiguration, Field
from addcorpus.json_corpora.constants import DEFAULT_CSV_DELIMITER
from addcorpus.es_mappings import primary_mapping_type

def export_json_corpus(corpus: Corpus) -> Dict:
    config = corpus.configuration
    data = {'name': corpus.name}
    data['meta'] = export_corpus_meta(config)
    data['source_data'] = export_corpus_source_data(config)
    options = export_corpus_options(config)
    if options:
        data['options'] = options
    data['fields'] = [
        export_json_field(field) for field in config.fields.all()
    ]
    return data

def export_corpus_meta(configuration: CorpusConfiguration) -> Dict:
    return {
        'title': configuration.title,
        'category': configuration.category,
        'description': configuration.description,
        'languages': configuration.languages,
        'date_range': {
            'min': configuration.min_year,
            'max': configuration.max_year,
        }
    }


def export_corpus_source_data(configuration: CorpusConfiguration) -> Dict:
    data = {
        'type': 'csv'
    }
    if configuration.source_data_delimiter != DEFAULT_CSV_DELIMITER:
        data['options'] = {'delimiter': configuration.source_data_delimiter}
    return data

def export_corpus_options(configuration: CorpusConfiguration) -> Dict:
    data = {}
    if configuration.document_context:
        data['document_context'] = configuration.document_context
    if configuration.default_sort:
        data['default_sort'] = configuration.default_sort
    if configuration.language_field:
        data['language_field'] = configuration.language_field
    return data


def export_json_field(field: Field) -> Dict:
    data = {
        'name': field.name,
        'display_name': field.display_name,
        'description': field.description,
        'type': export_field_type(field),
        'options': export_field_options(field),
        'extract': export_field_extract(field)
    }
    if field.language:
        data['language'] = field.language
    return data


def export_field_type(field: Field) -> str:
    if field.display_type == 'text' or field.display_type == 'keyword':
        return 'text_metadata'
    return field.display_type


def export_field_options(field: Field) -> Dict:
    return {
        'filter': export_field_filter(field),
        'hidden': field.hidden,
        'preview': field.results_overview,
        'search': field.searchable,
        'sort': field.sortable,
        'visualize': len(field.visualizations) > 0
    }


def export_field_filter(field: Field) -> str:
    if field.search_filter != {}:
        return 'show'
    filterable_mappings = ['keyword', 'int', 'float', 'date', 'boolean']
    if primary_mapping_type(field.es_mapping) in filterable_mappings and field.display_type != 'url':
        return 'hide'
    return 'none'


def export_field_extract(field: Field) -> Dict:
    return {'column': field.extract_column}
