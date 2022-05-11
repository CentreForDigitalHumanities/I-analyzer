from elasticsearch import Elasticsearch
from flask import current_app

from ianalyzer.factories.elasticsearch import elasticsearch
from es.search import get_index, search, hits

def scroll(corpus, query_model, download_size=None):
    index = get_index(corpus)
    client = elasticsearch(index)
    server = current_app.config['CORPUS_SERVER_NAMES'][corpus]
    scroll_timeout = current_app.config['SERVERS'][server]['scroll_timeout']
    size = current_app.config['SERVERS'][server]['scroll_page_size']
    output = []
    search_results = client.search(
        index=index,
        size = size,
        scroll = scroll_timeout,
        timeout = '60s'
        **query_model,
    )
    output.extend(search_results['hits']['hits'])
    if not download_size or download_size > search_results['hits']['total']['value']:
        download_size = search_results['hits']['total']['value']
    num_results = len(search_results['hits']['hits'])
    scroll_id = search_results['_scroll_id']
    while num_results < download_size:
        search_results = client.scroll(scroll_id=scroll_id,
            scroll=scroll_timeout)
        scroll_id = search_results['_scroll_id']
        num_results += len(search_results['hits']['hits'])
        output.extend(search_results['hits']['hits'])
    client.clear_scroll(scroll_id=scroll_id)
    return output


def normal_search(corpus, query_model, size):
    result = search(
        corpus = corpus,
        query_model=query_model,
        size = size,
    )
    return hits(result)
