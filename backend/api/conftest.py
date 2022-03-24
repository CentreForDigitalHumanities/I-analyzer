from time import sleep
import pytest
import os
from ianalyzer.factories.elasticsearch import elasticsearch
import ianalyzer.config_fallback as config
from ianalyzer.factories.app import flask_app
import es.es_index as index
from addcorpus.load_corpus import load_corpus

here = os.path.abspath(os.path.dirname(__file__))

class UnittestConfig:
    SECRET_KEY = b'dd5520c21ee49d64e7f78d3220b2be1dde4eb4a0933c8baf'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'  # in-memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    TESTING = True
    CORPORA = {
        'mock-corpus': os.path.join(here, 'tests', 'mock_corpus.py'),
    }
    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = {
        'mock-corpus': 'default',
    }
    CORPUS_DEFINITIONS = {}

    SAML_FOLDER = "saml"
    SAML_SOLISID_KEY = "uuShortID"
    SAML_MAIL_KEY = "mail"


@pytest.fixture(scope='session')
def test_app():
    """ Provide an instance of the application with Flask's test_client. """
    app = flask_app(UnittestConfig)
    app.testing = True
    ctx = app.app_context()
    ctx.push()
    yield app

    # performed after running tests
    ctx.pop()

@pytest.fixture(scope='session')
def test_es_client(test_app):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    try:
        client = elasticsearch('mock-corpus', UnittestConfig, sniff_on_start=True)
    except:
        client = None
    
    if client:
        # add data from mock corpus
        corpus = load_corpus('mock-corpus')
        index.create(client, corpus, False, True, False)
        index.populate(client, 'mock-corpus', corpus)

        # population may not be finished at this point,
        # so check if it's done, wait a while, check again
        for _ in range(10): # limited retries
            query = {'query': {'match_all': {}}}
            result = client.search('mock-corpus', body= query)
            doc_count = result['hits']['total']['value']

            if doc_count == 3:
                break

            sleep(2) # wait a while

        yield client

        # delete index when done
        client.indices.delete('mock-corpus')
    else:
        yield None


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

@pytest.fixture
def query_with_date_filter():
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
                "filter": [{
                    "range": {
                    "date": {
                        "gte": "1850-01-01",
                        "lte": "1859-12-31",
                        "format": "yyyy-MM-dd"
                        }
                    }
                }]
            }
        }
    }