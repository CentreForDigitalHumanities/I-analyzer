import pytest
import os

import ianalyzer.config_fallback as config
from ianalyzer.factories.app import flask_app

here = os.path.abspath(os.path.dirname(__file__))

TEST_VOCAB_SIZE = 200
TEST_DIMENSIONS = 20
TEST_BINS = [(1810, 1839), (1840, 1869), (1870, 1899)]
WM_MOCK_CORPORA = ['mock-svd-ppmi-corpus', 'mock-wordvec-corpus']
WM_TYPES = ['svd_ppmi', 'word2vec']

class UnittestConfig:
    SECRET_KEY = b'dd5520c21ee49d64e7f78d3220b2be1dde4eb4a0933c8baf'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'  # in-memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    TESTING = True
    CORPORA = {
        'mock-svd-ppmi-corpus': os.path.join(here, 'tests', 'mock_svd_ppmi_corpus.py'),
        'mock-wordvec-corpus': os.path.join(here, 'tests', 'mock_wordvec_corpus.py'),
    }
    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = {
        'mock-wordvec-corpus': 'default',
        'mock-svd-ppmi-corpus': 'default'
    }
    CORPUS_DEFINITIONS = {}

    SAML_FOLDER = "saml"
    SAML_SOLISID_KEY = "uuShortID"
    SAML_MAIL_KEY = "mail"


@pytest.fixture(scope='session')
def test_app(request):
    """ Provide an instance of the application with Flask's test_client. """
    app = flask_app(UnittestConfig)
    app.testing = True

    with app.app_context():
        yield app
