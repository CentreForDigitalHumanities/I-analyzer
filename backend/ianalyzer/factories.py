'''
For creation of Flask and ElasticSearch objects.
'''
import os

from elasticsearch import Elasticsearch

from flask import Flask
from flask_mail import Mail
from flask_login import LoginManager
from flask_seasurf import SeaSurf

from elasticsearch import Elasticsearch

from api.api import api
from .models import db
from admin.admin import admin_instance
from .entry import entry, login_manager
from es.es_forward import es
from saml.saml import saml_auth # SamlAuth from python3-saml
from saml.saml import saml # blueprint

from ianalyzer import config_fallback as config

def elasticsearch(corpus_name, cfg=config):
    '''
    Create ElasticSearch instance with default configuration.
    '''
    server_name = config.CORPUS_SERVER_NAMES[corpus_name]
    server_config = config.SERVERS[server_name]
    node = {'host': server_config['host'],
            'port': server_config['port']}
    if server_config['username']:
        node['http_auth'] = (server_config['username'], server_config['password'])
    return Elasticsearch([node])

def elasticsearch(corpus_name, cfg=config):
    '''
    Create ElasticSearch instance with default configuration.
    '''
    server_name = config.CORPUS_SERVER_NAMES[corpus_name]
    server_config = config.SERVERS[server_name]
    node = {'host': server_config['host'],
            'port': server_config['port']}
    if server_config['username']:
        node['http_auth'] = (server_config['username'], server_config['password'])
    return Elasticsearch([node])

def flask_app(cfg=config):
    '''
    Create Flask instance, with given configuration and flask_admin, flask_login,
    and csrf (SeaSurf) instances.
    '''
    app = Flask(__name__)
    csrf = SeaSurf()
    csrf.exempt_urls(('/es', '/saml'))
    mail = Mail()

    app.config.from_object(cfg)
    app.register_blueprint(entry)
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(es, url_prefix='/es')
    app.register_blueprint(saml, url_prefix='/saml')

    db.init_app(app)
    login_manager.init_app(app)
    admin_instance.init_app(app)
    csrf.init_app(app)
    mail.init_app(app)
    saml_auth.init_app(app)

    return app


