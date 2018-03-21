"""
Module to fallback to the default configuration for missing settings.
"""
from ianalyzer.default_config import *
from ianalyzer.config import *

def get_corpus_server_name(name):
    for server_name, server in SERVERS.items():
        for corpus in server['corpora']:
            if corpus == name:
                return server_name
    return None

SERVERS['default'] = {
    'corpora': [corpus for corpus in CORPORA.keys() if get_corpus_server_name(corpus) == None],
    'host': ES_HOST,
    'port': ES_PORT,
    'username': ES_USERNAME,
    'password': ES_PASSWORD,
    'chunk_size': ES_CHUNK_SIZE,
    'max_chunk_bytes': ES_MAX_CHUNK_BYTES,
    'bulk_timeout': ES_BULK_TIMEOUT,
    'overview_query_size': ES_OVERVIEW_QUERY_SIZE,
    'scroll_timeout': ES_SCROLL_TIMEOUT,
    'scroll_page_size': ES_SCROLL_PAGESIZE
}
