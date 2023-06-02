from users.models import CustomUser
import pytest
import os
from ianalyzer.elasticsearch import elasticsearch
from es import es_index as index
from addcorpus.load_corpus import load_corpus, load_all_corpora
from time import sleep
from visualization.tests.mock_corpora.small_mock_corpus import SPECS as SMALL_MOCK_CORPUS_SPECS
from visualization.tests.mock_corpora.large_mock_corpus import SPECS as LARGE_MOCK_CORPUS_SPECS
from redis import Redis

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture(params=['small-mock-corpus', 'large-mock-corpus'], scope='module')
def mock_corpus(request):
    '''Return the name of a mock corpus'''

    return request.param

@pytest.fixture()
def select_small_mock_corpus(mock_corpus):
    '''Only run test with the small mock corpus - skip otherwise'''

    if mock_corpus != 'small-mock-corpus':
        pytest.skip()

    return mock_corpus

@pytest.fixture()
def select_large_mock_corpus(mock_corpus):
    '''Only run test with the large mock corpus - skip otherwise.'''

    if mock_corpus != 'large-mock-corpus':
        pytest.skip()

    return mock_corpus

@pytest.fixture()
def mock_corpus_specs(mock_corpus):
    '''Return various specifications for the mock corpus (number of documents etc.)'''

    specs = {
        'small-mock-corpus': SMALL_MOCK_CORPUS_SPECS,
        'large-mock-corpus': LARGE_MOCK_CORPUS_SPECS,
    }
    return specs[mock_corpus]

def index_test_corpus(es_client, corpus_name):
    corpus = load_corpus(corpus_name)
    index.create(es_client, corpus, False, True, False)
    index.populate(es_client, corpus_name, corpus)

    # ES is "near real time", so give it a second before we start searching the index
    sleep(2)

def clear_test_corpus(es_client, corpus_name):
    corpus = load_corpus(corpus_name)
    index = corpus.es_index
    es_client.indices.delete(index = index)

@pytest.fixture(scope='module')
def index_mock_corpus(mock_corpus, es_client):
    '''Create and populate an index for the mock corpus.'''

    index_test_corpus(es_client, mock_corpus)
    yield mock_corpus
    clear_test_corpus(es_client, mock_corpus)

@pytest.fixture
def basic_query():
    return {
        "query": {
            "bool": {
                "must": {
                    "simple_query_string": {
                        "query": "test",
                        "lenient": True,
                        "default_operator": "or"
                    }
                },
                "filter": []
            }
        }
    }
