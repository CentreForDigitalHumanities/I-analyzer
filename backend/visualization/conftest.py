import pytest
import os
from es import es_index as index
from addcorpus.load_corpus import load_corpus
from time import sleep
from visualization.tests.mock_corpora.small_mock_corpus import SPECS as SMALL_MOCK_CORPUS_SPECS
from visualization.tests.mock_corpora.large_mock_corpus import SPECS as LARGE_MOCK_CORPUS_SPECS

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture(scope='session')
def small_mock_corpus():
    return 'small-mock-corpus'

@pytest.fixture(scope='session')
def large_mock_corpus(scope='session'):
    return 'large-mock-corpus'

@pytest.fixture(params=['small-mock-corpus', 'large-mock-corpus'], scope='session')
def mock_corpus(request):
    'parametrised version of the mock corpus fixtures: runs with both'

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
def small_mock_corpus_specs():
    '''Return various specifications for the mock corpus (number of documents etc.)'''
    return SMALL_MOCK_CORPUS_SPECS

@pytest.fixture()
def large_mock_corpus_specs():
    '''Return various specifications for the mock corpus (number of documents etc.)'''
    return LARGE_MOCK_CORPUS_SPECS

@pytest.fixture()
def mock_corpus_specs(mock_corpus, small_mock_corpus, large_mock_corpus,
                      small_mock_corpus_specs, large_mock_corpus_specs):
    '''Return various specifications for the mock corpus (number of documents etc.)'''

    specs = {
        small_mock_corpus: small_mock_corpus_specs,
        large_mock_corpus: large_mock_corpus_specs,
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
    # check existence in case teardown is executed more than once
    if es_client.indices.exists(index = index):
        es_client.indices.delete(index = index)

@pytest.fixture(scope='session')
def index_small_mock_corpus(small_mock_corpus, es_client):
    '''Create and populate an index for the small mock corpus.'''

    index_test_corpus(es_client, small_mock_corpus)
    yield small_mock_corpus
    clear_test_corpus(es_client, small_mock_corpus)

@pytest.fixture(scope='session')
def index_large_mock_corpus(large_mock_corpus, es_client):
    '''Create and populate an index for the large mock corpus'''

    index_test_corpus(es_client, large_mock_corpus)
    yield large_mock_corpus
    clear_test_corpus(es_client, large_mock_corpus)

@pytest.fixture(scope='module')
def index_mock_corpus(mock_corpus, index_small_mock_corpus, index_large_mock_corpus):
    '''Create and populate an index for the mock corpus.'''

    yield mock_corpus

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
