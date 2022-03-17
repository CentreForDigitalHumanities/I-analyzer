import pytest

from flask import json
from flask.testing import FlaskClient

from ianalyzer.factories.app import flask_app

@pytest.fixture(scope='session')
def celery_config():
    return {
        'broker_url': 'amqp://',
        'result_backend': 'amqp'
    }


TIMES_USER_PASSWORD = '12345'


class UnittestConfig:
    SECRET_KEY = 'poiuytrewqlkjhgfdsamnbvcxz'
    DEBUG = True
    TESTING = True

    SAML_FOLDER = "saml"
    SAML_SOLISID_KEY = "uuShortID"
    SAML_MAIL_KEY = "mail"


@pytest.fixture(scope='session')
def test_app(request, tmpdir_factory):
    """ Provide an instance of the application with Flask's test_client. """
    app = flask_app(UnittestConfig)
    app.testing = True
    app.config['CSV_FILES_PATH'] = str(tmpdir_factory.mktemp('test_files'))
    ctx = app.app_context()
    ctx.push()
    yield app

    # performed after running tests
    ctx.pop()
