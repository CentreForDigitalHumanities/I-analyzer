'''
For creation of Flask and ElasticSearch objects.
'''

from . import config
from . import sqla
from flask import Flask
from elasticsearch import Elasticsearch

def elasticsearch(cfg=config):
    node = {'host': cfg.ES_HOST,
            'port': cfg.ES_PORT}
    if cfg.ES_USERNAME:
        node['http_auth'] = (cfg.ES_USERNAME, cfg.ES_PASSWORD)
    return Elasticsearch([node])



def flask_app(blueprint, admin_instance, login_manager, cfg=config):
    app = Flask(__name__)
    app.config.from_object(cfg)
    app.register_blueprint(blueprint)
    
    sqla.db.init_app(app)
    login_manager.init_app(app)
    admin_instance.init_app(app)

    return app
