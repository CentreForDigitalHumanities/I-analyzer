'''
Module handles searching through the indices.
'''

from . import factories

from elasticsearch.helpers import scan
from datetime import datetime, timedelta

client = factories.elasticsearch()

def make_query(query_string=None, filters=[], **kwargs):
    '''
    Construct a dictionary representing an ES query. Query strings are read as
    the `simple_query_string` DSL of standard ElasticSearch.
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
        index=corpus.ES_INDEX,
        doc_type=corpus.ES_DOCTYPE,
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
        id = doc_source.get('_id')
        score = doc_source.get('_score')
        doc['score'] = score if score is not None else 1
        doc['id'] = id
        yield doc


def execute(corpus, query, size=config.ES_EXAMPLE_QUERY_SIZE):
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
