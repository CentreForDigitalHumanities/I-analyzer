'''
For creation of Flask and ElasticSearch objects.
'''

from . import config
from flask import Flask
from elasticsearch import Elasticsearch

def elasticsearch(cfg=config):
    node = {'host': cfg.ES_HOST,
            'port': cfg.ES_PORT}
    if cfg.ES_USERNAME:
        node['http_auth'] = (cfg.ES_USERNAME, cfg.ES_PASSWORD)
    return Elasticsearch([node])

def flask_app(blueprint, cfg=config):
    app = Flask(__name__)
    app.config.from_object(cfg)
    app.register_blueprint(blueprint)

    return app
