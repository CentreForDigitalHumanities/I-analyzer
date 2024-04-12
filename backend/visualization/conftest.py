import pytest
import os
import random

from conftest import index_test_corpus, clear_test_corpus
from corpora_test.small.small_mock_corpus import SPECS as SMALL_MOCK_CORPUS_SPECS
from visualization.tests.mock_corpora.large_mock_corpus import SPECS as LARGE_MOCK_CORPUS_SPECS

here = os.path.abspath(os.path.dirname(__file__))

class MockIndex(object):
    def analyze(self, index, body):
        return {'tokens': [{'token': 'test'}]}

class MockClient(object):
    ''' Mock ES Client returning random hits and term vectors '''
    def __init__(self, num_hits):
        self.num_hits = num_hits
        self.indices = MockIndex()

    def search(self, index, size, **kwargs):
        return {'hits':
            {'total': {'value': self.num_hits},
            'hits': [{'_id': hit_id} for hit_id in range(min(size, self.num_hits))]},
            '_scroll_id': '42'
        }

    def clear_scroll(self, scroll_id):
        return {'status': 'ok'}

    def termvectors(self, index, id, fields):
        ''' return 10 matches for term `test` '''
        return {'term_vectors': {field: {
            "terms": {'test': {
                    'ttf': random.randrange(1, 20000),
                    'tokens': [
                        {
                        "position": random.randrange(1, 200)
                        }
                        for j in range(10)
                    ]
                }, 'nottest': {
                    'ttf': random.randrange(1, 20000),
                    'tokens': [
                        {
                        "position": random.randrange(1, 200)
                        }
                        for j in range(5)
                    ]
                }
                }
            } for field in fields}}

@pytest.fixture()
def es_client_m_hits():
    ''' return a client that is expected to give:
    - 5000 total hits
    - size hits
    - size * 10 term matches
    '''
    return MockClient(5000)

@pytest.fixture()
def es_client_k_hits():
    ''' return a client that is expected give:
    - 500 total hits
    - size hits
    - size * 10 term matches
    '''
    return MockClient(500)

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

