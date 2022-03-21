from elasticsearch import Elasticsearch

from ianalyzer import config_fallback as config


def elasticsearch(corpus_name, cfg=config):
    '''
    Create ElasticSearch instance with default configuration.
    '''
    server_name = cfg.CORPUS_SERVER_NAMES[corpus_name]
    server_config = cfg.SERVERS[server_name]
    node = {'host': server_config['host'],
            'port': server_config['port']}
    if server_config.get('username'):
        node['http_auth'] = (server_config['username'],
                             server_config['password'])
    return Elasticsearch([node], timeout=30, max_retries=10, retry_on_timeout=True)
