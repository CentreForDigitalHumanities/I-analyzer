from elasticsearch import Elasticsearch

from django.conf import settings

def elasticsearch(corpus_name):
    '''
    Create ElasticSearch instance with default configuration.
    '''
    server_name = settings.CORPUS_SERVER_NAMES.get(corpus_name, 'default')
    server_config = settings.SERVERS[server_name]

    return client_from_config(server_config)


def client_from_config(server_config):
    node = {'host': server_config['host'],
            'port': int(server_config['port']),
            'scheme': 'http'
    }
    kwargs = {
        'max_retries': 15,
        'retry_on_timeout': True,
        'timeout': 60
    }
    if server_config.get('certs_location') and server_config.get('api_key'):
        # settings to connect via SSL are present
        node['scheme'] = 'https'
        kwargs['ca_certs'] = server_config.get('certs_location')
        kwargs['api_key'] = (server_config.get('api_id'), server_config.get('api_key'))
    client = Elasticsearch([node], **kwargs)
    return client
