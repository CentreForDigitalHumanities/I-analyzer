'''
Module handles searching through the indices and processing of results into CSV.
'''

from . import config
from . import factories

from datetime import datetime, timedelta

client = factories.elasticsearch()

def make_query(query_string=None, filter_must=[], filter_should=[], filter_must_not=[]):

    # Construct query
    q = {
        'query' : (
            {
                'query_string' : {
                    'query' : query_string,
                    'allow_leading_wildcard' : False
                }
            }
        if query_string else
            {
                'match_all' : {}
            }
        )
    }
    
    # Note: filtering works differently in ES5.0
    filters = {}
    if filter_must:
        filters['must'] = filter_must
    if filter_must_not:
        filters['must_not'] = filter_must_not
    if filter_should:
        filters['should'] = filter_should
    
    if filters:
        return {
            'query' : {
                'filtered' : {
                    'query': q['query'],
                    'filter': {# filters['should'][0] 
                        'bool': filters
                    }
                }
            }
        }
    else:
        return q
    
def validate(query):
    raise NotImplementedError()
    
# See page 127 for scan and scroll
def execute(query):
    '''
    Execute an ElasticSearch query and return an iterator of results
    as dictionaries.

    If a query has been given, it is interpreted as the mini query string language.
    '''

    # Search operation
    result = client.search(
        index=config.ES_INDEX,
        size=100,
        query=query,
        #query_params={
        #    'query_path' : 'hits.hits._source, hits.hits._score'
        #}
    )

    # Iterate through results
    for doc_source in result.get('hits', {}).get('hits', {}):
        doc = doc_source.get('_source')
        score = doc_source.get('_score')
        doc['score'] = score if score is not None else 1
        yield doc

    return result
