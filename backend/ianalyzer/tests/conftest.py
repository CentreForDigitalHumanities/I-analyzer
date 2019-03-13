import pytest
import responses

from werkzeug.security import generate_password_hash

from flask import json

from ianalyzer.factories.app import flask_app
from ianalyzer.models import db as database, User, Role
from ianalyzer.web import blueprint, admin_instance, login_manager, csrf
import ianalyzer.default_config as config

TIMES_USER_PASSWORD = '12345'


class UnittestConfig:
    SECRET_KEY = 'poiuytrewqlkjhgfdsamnbvcxz'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'  # in-memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    TESTING = True
    CORPORA = {
        'times': 'ianalyzer/corpora/times.py',
    }
    SERVERS = {
        'default': config.SERVERS['default']
    }
    CORPUS_SERVER_NAMES = {
        'times': 'default',
    }


@pytest.fixture
def app():
    """ Provide an instance of the application with Flask's test_client. """
    # The following line needs fixing. See #259 and #261.
    app = flask_app(blueprint, admin_instance, login_manager, csrf, UnittestConfig)
    app.testing = True
    return app


@pytest.fixture
def db(app):
    """
        Enable the database, fully set up and in context.

        Functions that use this fixture, inherit the application context in
        which the contents of the database are available. DO NOT create your
        own application context when using this fixture.
    """
    database.create_all(app=app)
    with app.app_context():
        database.session.begin(subtransactions=True)
        yield database
        database.session.rollback()


@pytest.fixture
def times_user(db):
    """ Ensure a user exists who has access to the Times corpus. """
    user = User('times', generate_password_hash(TIMES_USER_PASSWORD))
    role = Role(name='times')
    user.roles.append(role)
    db.session.add(user)
    db.session.add(role)
    db.session.commit()
    return user


@pytest.fixture
def login(app, times_user):
    """ Returns the response to a successful login, including the cookie. """
    return app.test_client().post('/api/login', data=json.dumps({
        'username': 'times',
        'password': TIMES_USER_PASSWORD,
    }), content_type='application/json')


@pytest.fixture
def requests():
    """ Allow mocking network requests using the `responses` package. """
    with responses.RequestsMock(assert_all_requests_are_fired=False) as mock:
        mock.Response = responses.Response
        yield mock
