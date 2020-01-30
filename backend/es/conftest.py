import pytest
import responses

from werkzeug.security import generate_password_hash

from flask import json
from flask.testing import FlaskClient
from flask_login import login_user

from ianalyzer.factories.app import flask_app
from ianalyzer.models import db as _db, Corpus, User, Role
import ianalyzer.config_fallback as config

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
        'times': 'default',
    }
    CORPUS_DEFINITIONS = {}
    TIMES_DATA = 'addcorpus/tests'
    TIMES_ES_INDEX = 'times'
    TIMES_IMAGE = 'times.jpg'
    TIMES_SCAN_IMAGE_TYPE = 'image/png'
    TIMES_DESCRIPTION_PAGE = 'times.md'

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