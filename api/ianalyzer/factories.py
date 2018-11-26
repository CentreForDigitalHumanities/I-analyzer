'''
For creation of Flask and ElasticSearch objects.
'''

from flask import Flask

from elasticsearch import Elasticsearch

from . import config_fallback as config
from .models import db
from .forward_es import es

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



def flask_app(blueprint, admin_instance, login_manager, csrf, mail, cfg=config):
    '''
    Create Flask instance, with given configuration and flask_admin, flask_login,
    and csrf (SeaSurf) instances.
    '''
    app = Flask(__name__)
    app.config.from_object(cfg)
    app.register_blueprint(blueprint)
    app.register_blueprint(es, url_prefix='/es')

    db.init_app(app)
    login_manager.init_app(app)
    admin_instance.init_app(app)
    csrf.init_app(app)
    mail.init_app(app)

    return app


