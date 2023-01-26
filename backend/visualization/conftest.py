from users.models import CustomUser
import pytest
import os
from ianalyzer.elasticsearch import elasticsearch
from es import es_index as index
from addcorpus.load_corpus import load_corpus, load_all_corpora
from time import sleep
from visualization.tests.mock_corpora.small_mock_corpus import SPECS as SMALL_MOCK_CORPUS_SPECS
from visualization.tests.mock_corpora.large_mock_corpus import SPECS as LARGE_MOCK_CORPUS_SPECS

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def mock_corpus_settings(settings):
    '''Add mock corpora to settings'''

    settings.CORPORA = {
        'small-mock-corpus': os.path.join(here, 'tests', 'mock_corpora', 'small_mock_corpus.py'),
        'large-mock-corpus': os.path.join(here, 'tests', 'mock_corpora', 'large_mock_corpus.py')
    }

@pytest.fixture(params=['small-mock-corpus', 'large-mock-corpus'])
def mock_corpus(request, mock_corpus_settings):
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

@pytest.fixture()
def test_es_client(mock_corpus):
    """
    Initialise an elasticsearch client. Skip if no connection can be made.
    """
    client = elasticsearch(mock_corpus)
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    return client

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

from django.conf import settings

@pytest.fixture()
def index_mock_corpus(mock_corpus, test_es_client):
    '''Create and populate an index for the mock corpus.'''

    index_test_corpus(test_es_client, mock_corpus)
    yield mock_corpus
    clear_test_corpus(test_es_client, mock_corpus)

@pytest.fixture()
def mock_corpora_in_db(db, mock_corpus_settings):
    load_all_corpora()

@pytest.fixture()
def corpus_user(db, mock_corpus, mock_corpora_in_db):
    '''Make a user with access to the mock corpus'''

    username = 'mock-user'
    password = 'secret'
    user = CustomUser.objects.create(username=username, password=password)
    return user

@pytest.fixture()
def authenticated_client(client, corpus_user):
    client.force_login(corpus_user)
    return client

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
