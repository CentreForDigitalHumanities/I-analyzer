from flask import Flask
from pyelasticsearch import ElasticSearch

def elasticsearch():
    return ElasticSearch('http://localhost:9200/')

def flask_app(cfg):
    app = Flask(__name__)
    app.config.from_object(cfg)
    app.register_blueprint(times2csv)

    return app