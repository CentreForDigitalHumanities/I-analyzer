import pytest
import responses

from ianalyzer.factories import flask_app
from ianalyzer.models import db, User, Role
from ianalyzer.web import blueprint, admin_instance, login_manager
import ianalyzer.default_config as config


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
def app_fix():
    """ Provide an instance of the application with Flask's test_client. """
    # The following line needs fixing. See #259 and #261.
    app = flask_app(blueprint, admin_instance, login_manager, UnittestConfig)
    app.testing = True
    return app


@pytest.fixture
def app_db_fix(app_fix):
    """
        Like app_fix, but with the database fully set up and in context.

        Functions that use this fixture, inherit the application context in
        which the contents of the database are available. DO NOT create your
        own application context when using this fixture.
    """
    db.create_all(app=app_fix)
    with app_fix.app_context():
        db.session.begin(subtransactions=True)
        yield app_fix, db
        db.session.rollback()


@pytest.fixture
def times_user(app_db_fix):
    """ Ensure a user exists who has access to the Times corpus. """
    app, db = app_db_fix
    user = User(username='times')
    role = Role(name='times')
    user.roles.append(role)
    db.session.add(user)
    db.session.add(role)
    db.session.commit()
    return user


@pytest.fixture
def requests():
    """ Allow mocking network requests using the `responses` package. """
    with responses.RequestsMock(assert_all_requests_are_fired=False) as mock:
        mock.Response = responses.Response
        yield mock
