'''
This module defines functions to check if a corpus is ready to be published.
'''

import os
from addcorpus.validation.creation import primary_mapping_type
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from addcorpus.models import Corpus, CorpusConfiguration

class CorpusNotPublishableError(Exception):
    '''
    The corpus is not meeting the requirements for publication.
    '''
    pass


def validate_ngram_has_date_field(corpus):
    fields = corpus.configuration.fields.all()
    has_ngram = any(
        _visualisations_require_date_field(field.visualizations) for field in fields
    )
    has_date_fields = _any_date_fields(fields)
    if  has_ngram and not has_date_fields:
        raise CorpusNotPublishableError(
            'The ngram visualisation requires a date field on the corpus'
        )

def _any_date_fields(fields):
    is_date = lambda field: primary_mapping_type(field.es_mapping) == 'date'
    return any(map(is_date, fields))

def _visualisations_require_date_field(visualizations):
    return visualizations and 'ngram' in visualizations

def validate_default_sort(corpus: 'Corpus'):
    config: 'CorpusConfiguration' = corpus.configuration
    if not config.default_sort:
        return
    field_name = config.default_sort['field']
    if not config.fields.filter(name=field_name).exists():
        raise CorpusNotPublishableError(
            f'Invalid default sort field: no field named "{field_name}"'
        )
    field = config.fields.get(name=field_name)
    if not field.sortable:
        raise CorpusNotPublishableError(
            f'Invalid default sort field: field "{field_name}" is not sortable'
        )


def validate_complete_metadata(corpus: 'Corpus'):
    config: 'CorpusConfiguration' = corpus.configuration
    if config.min_year is None or config.max_year is None:
        raise CorpusNotPublishableError(
            'Date range not specified'
        )
    if config.category is None:
        raise CorpusNotPublishableError(
            'Category not specified'
        )
