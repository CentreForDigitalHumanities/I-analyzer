from time import sleep
import pytest
import os
from ianalyzer.factories.elasticsearch import elasticsearch
import ianalyzer.config_fallback as config
from ianalyzer.factories.app import flask_app
import es.es_index as index
from es.search import get_index
from addcorpus.load_corpus import load_corpus
from ianalyzer.models import db as _db, User, Role, Corpus
here = os.path.abspath(os.path.dirname(__file__))
from werkzeug.security import generate_password_hash
from flask.testing import FlaskClient
import json

MOCK_USER_PASSWORD = '1234'

class UnittestConfig:
    SECRET_KEY = b'dd5520c21ee49d64e7f78d3220b2be1dde4eb4a0933c8baf'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'  # in-memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    TESTING = True
    CORPORA = {
        'mock-corpus': os.path.join(here, 'tests', 'mock_corpus.py'),
        'large-mock-corpus': os.path.join(here, 'tests', 'large_mock_corpus.py')
    }
    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = {
        'mock-corpus': 'default',
        'large-mock-corpus': 'default',
    }
    CORPUS_DEFINITIONS = {}

    SAML_FOLDER = "saml"
    SAML_SOLISID_KEY = "uuShortID"
    SAML_MAIL_KEY = "mail"

@pytest.fixture(scope='session')
def celery_config():
    return {
        'broker_url': 'amqp://',
        'result_backend': 'amqp'
    }

@pytest.fixture(scope='session')
def test_app(request, tmpdir_factory):
    """ Provide an instance of the application with Flask's test_client. """
    app = flask_app(UnittestConfig)
    app.testing = True
    app.config['CSV_FILES_PATH'] = str(tmpdir_factory.mktemp('test_files'))

    with app.app_context():
        yield app


@pytest.fixture(scope='session')
def db(test_app):
    """Session-wide test database."""
    _db.app = test_app
    _db.create_all()
    yield _db

    # performed after running tests
    _db.drop_all()


@pytest.fixture(scope='function')
def session(db, request):
    """Creates a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    options = dict(bind=connection, binds={})
    session = db.create_scoped_session(options=options)

    db.session = session
    yield session

    # performed after running tests
    session.remove()
    transaction.rollback()
    connection.close()

@pytest.fixture()
def mock_user(session):
    """ Ensure a user exists who has access to the mock corpora. """
    user = User('mock-user', generate_password_hash(MOCK_USER_PASSWORD))
    role = Role(name='mock-access')
    mock_corpus = Corpus(name='mock-corpus')
    large_mock_corpus = Corpus(name='large-mock-corpus')
    role.corpora.append(mock_corpus)
    role.corpora.append(large_mock_corpus)
    user.role = role
    session.add(user)
    session.add(mock_corpus)
    session.add(large_mock_corpus)
    session.add(role)
    session.commit()
    return user


class CustomTestClient(FlaskClient):
    def mock_user_login(self):
        return self.login('mock-user', MOCK_USER_PASSWORD)

    def login(self, user_name, password):
        return self.post('/api/login', data=json.dumps({
            'username': user_name,
            'password': password,
        }), content_type='application/json')


@pytest.fixture()
def client(test_app):
    test_app.test_client_class = CustomTestClient
    with test_app.test_client() as client:
        yield client


@pytest.fixture(scope='session')
def test_es_client(test_app):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch('mock-corpus')
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    return client

@pytest.fixture(scope='session')
def indexed_mock_corpus(test_es_client):
    index_test_corpus(test_es_client, 'mock-corpus')
    yield 'mock-corpus'
    clear_test_corpus(test_es_client, 'mock-corpus')

@pytest.fixture(scope='session')
def indexed_large_mock_corpus(test_es_client):
    index_test_corpus(test_es_client, 'large-mock-corpus')
    yield 'large-mock-corpus'
    clear_test_corpus(test_es_client, 'large-mock-corpus')

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
