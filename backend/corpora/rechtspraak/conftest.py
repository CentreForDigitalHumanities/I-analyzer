from addcorpus.load_corpus import load_corpus
import ianalyzer.config_fallback as config
from ianalyzer.factories.app import flask_app
import pytest
import os.path as op
here = op.abspath(op.dirname(__file__))


class UnittestConfig:
    SECRET_KEY = b'dd5520c21ee49d64e7f78d3220b2be1dde4eb4a0933c8baf'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'  # in-memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    TESTING = True
    CORPORA = {
        'rechtspraak': op.join(here, 'rechtspraak.py')
    }

    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = {
        'rechtspraak': 'default'
    }

    RECHTSPRAAK_DATA = op.join(here, 'tests', 'data')
    RECHTSPRAAK_IMAGE = 'troon.jpg'
    RECHTSPRAAK_ES_INDEX = 'rechtspraak'
    RECHTSPRAAK_ES_DOCTYPE = 'article'

    # ?? apparantly needed to not crash
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


@pytest.fixture
def test_corpus(test_app):
    return load_corpus('rechtspraak')


@pytest.fixture
def corpus_test_data():
    return {
        'name': 'rechtspraak',
        'docs': [
            {
                'id': 'ECLI:NL:CBB:2022:1',
                'issued': '2022-01-11'
            }],
    }
