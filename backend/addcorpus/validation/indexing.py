'''
This module defines functions to check if a corpus is ready for indexing.
'''

from addcorpus.models import Corpus

class CorpusNotIndexableError(Exception):
    '''
    The Corpus is not meeting the requirements for indexing.
    '''

    pass


def validate_ready_to_index(corpus: Corpus) -> None:
    '''
    Validation to check if the corpus is ready for indexing.

    Returns nothing, but raises exceptions when validation fails.
    '''

    validate_has_configuration(corpus)


def validate_has_configuration(corpus: Corpus):
    if not corpus.has_configuration:
        raise CorpusNotIndexableError('Corpus has no attached configuration')
