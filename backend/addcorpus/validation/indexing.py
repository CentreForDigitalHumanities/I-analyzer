'''
This module defines functions to check if a corpus is ready for indexing.
'''

import warnings

class CorpusNotIndexableError(Exception):
    '''
    The Corpus is not meeting the requirements for indexing.
    '''

    pass


def validate_ready_to_index(corpus) -> None:
    '''
    Validation to check if the corpus is ready for indexing.

    Returns nothing, but raises exceptions when validation fails.
    '''

    validate_has_configuration(corpus)

    config = corpus.configuration
    fields = config.fields.all()

    validate_fields(fields)


def validate_has_configuration(corpus):
    if not corpus.has_configuration:
        raise CorpusNotIndexableError('Corpus has no attached configuration')

def validate_fields(fields):
    if not len(fields):
        raise CorpusNotIndexableError('Corpus has no fields')

    _raise_if_no_content_field(fields)
    _raise_if_no_metadata_field(fields)
    _warn_if_no_id_field(fields)

def _raise_if_no_content_field(fields):
    if not any(field.is_main_content for field in fields):
        raise CorpusNotIndexableError('Corpus has no main content field')

def _raise_if_no_metadata_field(fields):
    if all(field.is_main_content for field in fields):
        raise CorpusNotIndexableError('Corpus has no metadata fields')

def _warn_if_no_id_field(fields):
    if not any(field.name == 'id' for field in fields):
        warnings.warn(
            "Corpus has no 'id' field. Document IDs will be unstable between index "
            "versions."
        )

