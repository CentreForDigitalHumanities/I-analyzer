from elasticsearch import Elasticsearch

from ianalyzer import config_fallback as config
from flask import current_app

def elasticsearch(corpus_name, cfg=config, sniff_on_start=False):
    '''
    Create ElasticSearch instance with default configuration.
    '''
    server_name = current_app.config.get('CORPUS_SERVER_NAMES')[corpus_name]
    server_config = current_app.config.get('SERVERS')[server_name]
    node = {'host': server_config['host'],
            'port': server_config['port']}
    if server_config.get('certs_location') and server_config.get('api_key'):
        # settings to connect via SSL are present
        return Elasticsearch([node],
            request_timeout=30, max_retries=10, retry_on_timeout=True,
            sniff_on_start=sniff_on_start,
            ca_certs = server_config.get('certs_location'),
            api_key = (server_config.get('api_id'), server_config.get('api_key'))
        )
    return Elasticsearch([node],
        request_timeout=30, max_retries=10, retry_on_timeout=True,
        sniff_on_start=sniff_on_start
    )
