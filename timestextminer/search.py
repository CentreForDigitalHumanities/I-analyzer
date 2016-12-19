'''
Module handles searching through the indices.
'''

from . import factories

from elasticsearch.helpers import scan
from datetime import datetime, timedelta

client = factories.elasticsearch()

def make_query(query_string=None, filters=[], **kwargs):

    # https://www.elastic.co/guide/en/elasticsearch/reference/5.x/query-dsl-simple-query-string-query.html

    # Construct query
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



# See page 127 for scan and scroll
def execute_iterate(corpus, query, size=50000):
    '''
    Execute an ElasticSearch query and return an iterator of results
    as dictionaries.

    If a query has been given, it is interpreted as the mini query string language.
    '''

    result = scan(client,
        query=query,
        index=corpus.ES_INDEX,
        doc_type=corpus.ES_DOCTYPE,
        size=5000 if size > 5000 else size,
        scroll='3m',
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


def execute(corpus, query, size=5):
    '''
    Execute an ElasticSearch query and return a dict with results.
    '''

    # Search operation
    result = client.search(
        index=corpus.ES_INDEX,
        doc_type=corpus.ES_DOCTYPE,
        #fielddata_fields=[],
        #stored_fields=[],
        size=size,
        body=query,
        #filter_path=['hits.hits._id', 'hits.hits._source']
    )
    
    return result 
