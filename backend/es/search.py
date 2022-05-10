from typing import Dict
from ianalyzer.factories.elasticsearch import elasticsearch
from addcorpus.load_corpus import load_corpus

def get_index(corpus):
    corpus_class = load_corpus(corpus)
    return corpus_class.es_index

def search(corpus, query_model: Dict = {}, client = None, **kwargs):
    """
    Make a basic search request.

    Parameters:
    - `corpus`: the name of the corpus in config
    - `query_model`: a query dict (optional)
    - `client`: an elasticsearch client (optional). Provide this if there is already
    and active client in the session. If left out, a new client will be instantiated.
    - kwargs: any arguments that should be passed on to the `search()` function of
    the elasticsearch client
    """
    index = get_index(corpus)

    if not client:
        client = elasticsearch(index)
    
    search_result = client.search(
        index=index,
        **query_model,
        **kwargs,
    )
    return search_result

def total_hits(search_result):
    return search_result['hits']['total']['value']

def hits(search_result):
    return search_result['hits']['hits']

def aggregation_results(search_result):
    return search_result['aggregations']
