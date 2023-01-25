from elasticsearch import Elasticsearch

from ianalyzer import config_fallback as config
from flask import current_app

def elasticsearch(corpus_name):
    '''
    Create ElasticSearch instance with default configuration.
    '''
    server_name = current_app.config.get('CORPUS_SERVER_NAMES').get(corpus_name, 'default')
    server_config = current_app.config.get('SERVERS')[server_name]

    node = {'host': server_config['host'],
            'port': int(server_config['port']),
            'scheme': 'http'
    }
    kwargs = {
        'request_timeout': 30, 
        'max_retries': 15, 
        'retry_on_timeout': True,
        'timeout': 30
    }
    if server_config.get('certs_location') and server_config.get('api_key'):
        # settings to connect via SSL are present
        node['scheme'] = 'https'
        kwargs['ca_certs'] = server_config.get('certs_location')
        kwargs['api_key'] = (server_config.get('api_id'), server_config.get('api_key'))
    client = Elasticsearch([node], **kwargs)
    return client
