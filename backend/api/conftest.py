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
    client = elasticsearch('mock-corpus', UnittestConfig)
    corpus = load_corpus('mock-corpus')
    index.create(client, corpus, False, True, False)
    index.populate(client, 'mock-corpus', corpus)

    yield client

    client.delete('mock-corpus')

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