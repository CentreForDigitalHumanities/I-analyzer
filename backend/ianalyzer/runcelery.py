from ianalyzer import celery
from ianalyzer.factories.app import flask_app
from ianalyzer.factories.celery import init_celery
from ianalyzer import config_fallback as config

app = flask_app(config)
init_celery(app, celery)