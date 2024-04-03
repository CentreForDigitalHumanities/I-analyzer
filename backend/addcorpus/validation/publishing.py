'''
This module defines functions to check if a corpus is ready to be published.
'''

import os
from addcorpus.validation.creation import primary_mapping_type

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

def validate_default_sort(corpus):
    config = corpus.configuration
    if not config.default_sort:
        return
    field_name = config.default_sort['field']
    if not corpus.configuration.fields.filter(name=field_name).exists():
        raise CorpusNotPublishableError(
            f'Invalid default sort field: no field named "{field_name}"'
        )
    field = corpus.configuration.fields.get(name=field_name)
    if not field.sortable:
        raise CorpusNotPublishableError(
            f'Invalid default sort field: field "{field_name}" is not sortable'
        )

def validate_has_image(corpus):
    config = corpus.configuration
    if not config.image:
        raise CorpusNotPublishableError('Corpus has no image')

    if not os.path.exists(config.image.path):
        raise FileNotFoundError(f'Corpus image {config.image.path} does not exist')
