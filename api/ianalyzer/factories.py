'''
For creation of Flask and ElasticSearch objects.
'''

from flask import Flask
from flask_scss import Scss

from elasticsearch import Elasticsearch

from . import config
from .models import db

def elasticsearch(cfg=config):
    '''
    Create ElasticSearch instance with default configuration.
    '''
    node = {'host': cfg.ES_HOST,
            'port': cfg.ES_PORT}
    if cfg.ES_USERNAME:
        node['http_auth'] = (cfg.ES_USERNAME, cfg.ES_PASSWORD)
    return Elasticsearch([node])



def flask_app(blueprint, admin_instance, login_manager, cfg=config):
    '''
    Create Flask instance, with given configuration and flask_admin and
    flask_login instances.
    '''
    app = Flask(__name__)
    app.config.from_object(cfg)
    app.register_blueprint(blueprint)

    db.init_app(app)
    login_manager.init_app(app)
    admin_instance.init_app(app)


    Scss(app)

    return app
