from users.models import CustomUser
import pytest
import os
from ianalyzer.elasticsearch import elasticsearch
from es import es_index as index
from addcorpus.load_corpus import load_corpus
from time import sleep
from visualization.tests.mock_corpora.mock_corpus import SPECS as MOCK_CORPUS_SPECS

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def mock_corpus_settings(settings):
    settings.CORPORA = {
        'mock-corpus': os.path.join(here, 'tests', 'mock_corpora', 'mock_corpus.py'),
    }

@pytest.fixture()
def mock_corpus(mock_corpus_settings):
    return 'mock-corpus'

@pytest.fixture()
def mock_corpus_specs(mock_corpus):
    specs = {
        'mock-corpus': MOCK_CORPUS_SPECS
    }
    return specs[mock_corpus]

@pytest.fixture()
def test_es_client(mock_corpus):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
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

@pytest.fixture()
def indexed_mock_corpus(mock_corpus, test_es_client):
    index_test_corpus(test_es_client, mock_corpus)
    yield mock_corpus
    clear_test_corpus(test_es_client, mock_corpus)


@pytest.fixture()
def corpus_user(db):
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
