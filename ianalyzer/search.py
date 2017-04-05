'''
Module handles searching through the indices.
'''

import logging; logger = logging.getLogger(__name__)
from . import factories
from . import config

from elasticsearch.helpers import scan
from datetime import datetime, timedelta

client = factories.elasticsearch()

def make_query(query_string=None, filters=[], **kwargs):
    '''
    Construct a dictionary representing an ES query. Query strings are read as
    the `simple_query_string` DSL of standard ElasticSearch; filters should be
    a list of dictionaries representing the ES DSL.
    '''

    q = {
        'match_all' : {}
    }
    
    if query_string:
        q = {
            'simple_query_string' : {
                'query' : query_string,
                #'allow_leading_wildcard' : False, not necessary for simple_
                'lenient' : True,
                'default_operator' : 'or'
            }
        }
    
    
    if filters:
        return {
            'query': {
                'bool': {
                    'must': q,
                    'filter': filters,
                }
            }
        }
    else:
        return {
            'query': q
        }



def execute_iterate(corpus, query, size):
    '''
    Execute an ElasticSearch query and return an iterator of results
    as dictionaries.
    '''

    result = scan(client,
        query=query,
        index=corpus.es_index,
        doc_type=corpus.es_doctype,
        size=(
            config.ES_SCROLL_PAGESIZE
            if size > config.ES_SCROLL_PAGESIZE
            else size
        ),
        scroll=config.ES_SCROLL_TIMEOUT,
    )
    
    for i, doc_source in enumerate(result):
        if i >= size:
            break
        doc = doc_source.get('_source', {}).get('doc')
        doc['id'] = doc_source.get('_id')
        yield doc


def execute(corpus, query, size):
    '''
    Execute an ElasticSearch query and return a dictionary containing the
    results.
    '''

    result = client.search(
        index=corpus.es_index,
        doc_type=corpus.es_doctype,
        size=size,
        body=query,
    )
    
    return result 
