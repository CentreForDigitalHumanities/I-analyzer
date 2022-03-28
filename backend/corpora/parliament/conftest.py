import pytest
from flask.testing import FlaskClient
from ianalyzer.factories.app import flask_app
import ianalyzer.config_fallback as config
import os

here = os.path.abspath(os.path.dirname(__file__))

class UnittestConfig:
    SECRET_KEY = b'dd5520c21ee49d64e7f78d3220b2be1dde4eb4a0933c8baf'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'  # in-memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    TESTING = True
    CORPORA = {
        'parliament-uk': os.path.join(here, 'uk.py'),
        'parliament-netherlands': os.path.join(here, 'netherlands.py'),
        'parliament-canada': os.path.join(here, 'canada.py'),
    }
    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = {
        'parliament-uk': 'default',
        'parliament-netherlands': 'default',
        'parliament-canada': 'default',
    }
    CORPUS_DEFINITIONS = {}
    PP_ALIAS = 'parliament'
    PP_UK_DATA = os.path.join(here, 'tests', 'data', 'uk')
    PP_UK_INDEX = 'parliament-uk'
    PP_UK_IMAGE = 'uk.jpeg'
    PP_NL_DATA = os.path.join(here, 'tests', 'data', 'netherlands')
    PP_NL_INDEX = 'parliament-netherlands'
    PP_NL_IMAGE = 'netherlands.jpg'
    PP_CANADA_DATA = os.path.join(here, 'tests', 'data', 'canada')
    PP_CANADA_INDEX = 'parliament-canada'
    PP_CANADA_IMAGE = 'canada.jpeg'

    # Elasticsearch settings for People & Parliament corpora
    PP_ES_SETTINGS = {
        "analysis": {
            "analyzer": {
                "clean": {
                    "tokenizer": "standard",
                    "char_filter": ["number_filter"],
                    "filter": ["lowercase", "stopwords"]
                },
                "stemmed": {
                    "tokenizer": "standard",
                    "char_filter": ["number_filter"],
                    "filter": ["lowercase", "stopwords", "stemmer"]
                }
            },
            "char_filter":{
                "number_filter":{
                    "type":"pattern_replace",
                    "pattern":"\\d+",
                    "replacement":""
                }
            }
        }
    }

    SAML_FOLDER = "saml"
    SAML_SOLISID_KEY = "uuShortID"
    SAML_MAIL_KEY = "mail"


@pytest.fixture(scope='session')
def test_app(request):
    """ Provide an instance of the application with Flask's test_client. """
    app = flask_app(UnittestConfig)
    app.testing = True
    ctx = app.app_context()
    ctx.push()
    yield app

    # performed after running tests
    ctx.pop()
