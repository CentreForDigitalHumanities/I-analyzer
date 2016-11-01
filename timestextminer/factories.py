'''
For creation of Flask and ElasticSearch objects.
'''

from . import config
from flask import Flask
from pyelasticsearch import ElasticSearch

def elasticsearch(cfg=config):
    node = {'urls': cfg.ES_HOST,
            'port': cfg.ES_PORT}
    if cfg.ES_USERNAME:
        node['username'] = cfg.ES_USERNAME
        node['password'] = cfg.ES_PASSWORD
    return ElasticSearch(**node)

def flask_app(blueprint, cfg=config):
    app = Flask(__name__)
    app.config.from_object(cfg)
    app.register_blueprint(blueprint)

    return app
