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
        'parliament-germany-new': os.path.join(here, 'germany-new.py'),
        'parliament-germany-old': os.path.join(here, 'germany-old.py'),
        'parliament-france': os.path.join(here, 'france.py'),
        'parliament-sweden': os.path.join(here, 'sweden.py'),
        'parliament-sweden-old': os.path.join(here, 'sweden-old.py'),
        'parliament-denmark': os.path.join(here, 'denmark.py'),
        'parliament-denmark-new': os.path.join(here, 'denmark-new.py'),
        'parliament-finland': os.path.join(here, 'finland.py'),
        'parliament-norway': os.path.join(here, 'norway.py'),
        'parliament-norway-new': os.path.join(here, 'norway-new.py'),
        'parliament-ireland': os.path.join(here, 'ireland.py')
    }

    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = { }
    CORPUS_DEFINITIONS = {}
    PP_ALIAS = 'parliament'
    PP_UK_DATA = os.path.join(here, 'tests', 'data', 'uk')
    PP_UK_INDEX = 'parliament-uk'
    PP_UK_IMAGE = 'uk.jpeg'
    PP_UK_WM = None

    PP_NL_DATA = os.path.join(here, 'tests', 'data', 'netherlands')
    PP_NL_RECENT_DATA = os.path.join(here, 'tests', 'data', 'netherlands-recent')
    PP_NL_INDEX = 'parliament-netherlands'
    PP_NL_IMAGE = 'netherlands.jpg'

    PP_CANADA_DATA = os.path.join(here, 'tests', 'data', 'canada')
    PP_CANADA_INDEX = 'parliament-canada'
    PP_CANADA_IMAGE = 'canada.jpeg'
    PP_GERMANY_NEW_DATA = os.path.join(here, 'tests', 'data', 'germany-new')
    PP_GERMANY_NEW_INDEX = 'parliament-germany-new'
    PP_GERMANY_NEW_IMAGE = 'germany-new.jpeg'
    PP_GERMANY_OLD_DATA = os.path.join(here, 'tests', 'data', 'germany-old')
    PP_GERMANY_OLD_INDEX = 'parliament-germany-old'
    PP_GERMANY_OLD_IMAGE= 'germany-old.jpeg'
    PP_FR_INDEX = 'parliament-france'
    PP_FR_DATA = os.path.join(here, 'tests', 'data', 'france')
    PP_FR_IMAGE = 'france.jpeg'
    PP_SWEDEN_INDEX = 'parliament-sweden'
    PP_SWEDEN_DATA = os.path.join(here, 'tests', 'data', 'sweden')
    PP_SWEDEN_IMAGE = 'sweden.jpg'
    PP_SWEDEN_OLD_INDEX = 'parliament-sweden-old'
    PP_SWEDEN_OLD_DATA = os.path.join(here, 'tests', 'data', 'sweden-old')
    PP_SWEDEN_OLD_IMAGE = 'sweden-old.jpg'
    PP_FINLAND_INDEX = 'parliament-finland'
    PP_FINLAND_DATA = os.path.join(here, 'tests', 'data', 'finland')
    PP_NORWAY_INDEX = 'parliament-norway'
    PP_NORWAY_DATA = os.path.join(here, 'tests', 'data', 'norway')
    PP_NORWAY_NEW_INDEX = 'parliament-norway-new'
    PP_NORWAY_NEW_DATA = os.path.join(here, 'tests', 'data', 'norway-new')
    PP_DENMARK_DATA = os.path.join(here, 'tests', 'data', 'denmark')
    PP_DENMARK_INDEX = 'parliament-denmark'
    PP_DENMARK_NEW_DATA = os.path.join(here, 'tests', 'data', 'denmark-new')
    PP_DENMARK_NEW_INDEX = 'parliament-denmark-new'
    PP_IRELAND_DATA = os.path.join(here, 'tests', 'data', 'ireland')
    PP_IRELAND_INDEX = 'parliament-ireland'

    PP_UK_WM = None
    PP_DE_WM = None
    PP_FR_WM = None
    PP_CA_WM = None
    PP_NL_WM = None

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