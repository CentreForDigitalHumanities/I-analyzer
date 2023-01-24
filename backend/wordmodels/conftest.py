import pytest
import os
from django.conf import settings

here = os.path.abspath(os.path.dirname(__file__))

TEST_VOCAB_SIZE = 200
TEST_DIMENSIONS = 20
TEST_BINS = [(1810, 1839), (1840, 1869), (1870, 1899)]


@pytest.fixture()
def mock_corpus_settings(settings):
    settings.CORPORA = {
        'mock-corpus': os.path.join(here, 'tests', 'mock-corpus', 'mock_corpus.py'),
    }
    return settings

@pytest.fixture()
def mock_corpus(mock_corpus_settings):
    ''' return the first key of the CORPORA dict '''
    return next(iter(settings.CORPORA.keys()))
