from elasticsearch import Elasticsearch
from flask import current_app

from ianalyzer.factories.elasticsearch import elasticsearch

def scroll(corpus, query_model, download_size=None):
    #client = ianalyzer.factories.elasticsearch(corpus)
    client = elasticsearch(corpus)
    server = current_app.config['CORPUS_SERVER_NAMES'][corpus]
    scroll_timeout = current_app.config['SERVERS'][server]['scroll_timeout']
    size = current_app.config['SERVERS'][server]['scroll_page_size']
    output = []
    search_results = client.search(
        index=corpus,
        size = size,
        scroll = scroll_timeout,
        body = query_model
    )
    output.extend(search_results['hits']['hits'])
    download_size = download_size or search_results['hits']['total']
    num_results = len(search_results['hits']['hits'])
    scroll_id = search_results['_scroll_id']
    while num_results < download_size:
        search_results = client.scroll(scroll_id = scroll_id,
            scroll=scroll_timeout)
        scroll_id = search_results['_scroll_id']
        num_results += len(search_results['hits']['hits'])
        output.extend(search_results['hits']['hits'])
    client.clear_scroll(scroll_id=scroll_id)
    return output


def search_thousand(corpus, query_model):
    #client = ianalyzer.factories.elasticsearch(corpus)
    client = elasticsearch(corpus)
    size = 1000
    search_results = client.search(
        index=corpus,
        size = size,
        body = query_model
    )
    return search_results['hits']['hits']