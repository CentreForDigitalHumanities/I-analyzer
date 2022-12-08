import pytest
import responses
from time import sleep
import sys

from werkzeug.security import generate_password_hash

from flask import json
from flask.testing import FlaskClient
from flask_login import login_user

from ianalyzer.factories.app import flask_app
from ianalyzer.factories.elasticsearch import elasticsearch
from ianalyzer.models import db as _db, Corpus, User, Role
import ianalyzer.config_fallback as config

from es import es_index

from addcorpus.load_corpus import load_corpus

TIMES_USER_PASSWORD = '12345'


class UnittestConfig:
    SECRET_KEY = 'poiuytrewqlkjhgfdsamnbvcxz'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'  # in-memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    TESTING = True
    CORPORA = {
        'times': 'corpora/times/times.py'
    }
    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = {
        'times': 'default'
    }
    CORPUS_DEFINITIONS = {}
    TIMES_DATA = 'addcorpus/tests'
    TIMES_ES_INDEX = 'ianalyzer-test-times'
    TIMES_ES_DOCTYPE = 'article'
    TIMES_IMAGE = 'times.jpg'
    TIMES_SCAN_IMAGE_TYPE = 'image/png'
    TIMES_DESCRIPTION_PAGE = 'times.md'

    SAML_FOLDER = "saml"
    SAML_SOLISID_KEY = "uuShortID"
    SAML_MAIL_KEY = "mail"

CORPUS_NAME = 'times'


@pytest.fixture(scope='session')
def test_app(request):
    """ Provide an instance of the application with Flask's test_client. """
    app = flask_app(UnittestConfig)
    app.testing = True

    with app.app_context():
        yield app

@pytest.fixture
def corpus_definition(test_app):
    corpus = load_corpus(CORPUS_NAME)
    yield corpus

@pytest.fixture(scope='module')
def es_forward_client(test_app):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch(CORPUS_NAME)
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    # add data from mock corpus
    corpus = load_corpus(CORPUS_NAME)
    es_index.create(client, corpus, False, True, False)
    es_index.populate(client, CORPUS_NAME, corpus)
    client.index(index=corpus.es_index, document={'content': 'banana'})

    # ES is "near real time", so give it a second before we start searching the index
    sleep(1)
    yield client
    # delete index when done
    client.indices.delete(index='ianalyzer-test-times')

@pytest.fixture
def es_index_client(test_app):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch('times')
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    yield client
    # delete indices when done
    indices = client.indices.get(index='ianalyzer-test*')
    for index in indices.keys():
        client.indices.delete(index=index)

@pytest.fixture()
def es_alias_client(test_app):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch('times')
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    # add data from mock corpus
    corpus = load_corpus('times')
    es_index.create(client, corpus, False, True, True) # create ianalyzer-times_1 index
    client.indices.create(index='ianalyzer-test-times_2')
    client.indices.create(index='ianalyzer-test-times-bla_3')

    yield client
    # delete index when done
    indices = client.indices.get(index='ianalyzer-test*')
    for index in indices.keys():
        client.indices.delete(index=index)


class CustomTestClient(FlaskClient):
    def times_login(self):
        return self.login('times', TIMES_USER_PASSWORD)

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


@pytest.fixture
def times_user(session):
    """ Ensure a user exists who has access to the Times corpus. """
    user = User('times', generate_password_hash(TIMES_USER_PASSWORD))
    role = Role(name='times_access')
    corpus = Corpus(name='times')
    role.corpora.append(corpus)
    user.role = role
    session.add(user)
    session.add(corpus)
    session.add(role)
    session.commit()
    return user


@pytest.fixture
def admin_role(session):
    """ Ensure that there is an admin role present (needed for load_corpus methods) """
    role = Role(name='admin')
    session.add(role)
    session.commit()
    return role


@pytest.fixture
def requests():
    """ Allow mocking network requests using the `responses` package. """
    with responses.RequestsMock(assert_all_requests_are_fired=False) as mock:
        mock.Response = responses.Response
        yield mock
