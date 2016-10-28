'''
Module handles searching through the indices and processing of results into CSV.
'''

import config
import factories
import data

import csv
from datetime import datetime, timedelta

client = factories.elasticsearch()


# See page 127 for scan and scroll
def execute(query_string=None, sieve=None):
    '''
    Execute an ElasticSearch query and return an iterator of results
    as dictionaries.

    If a query has been given, it is interpreted as the mini query string language.
    '''


    # Construct query
    q = dict()

    if query_string:
        q['query'] = {
            'query_string' : {
                'query' : query_string,
                'allow_leading_wildcard' : False
            }
        }

    if sieve:
        q['filter'] = sieve

    # Search operation
    result = client.search(
        index=config.ES_INDEX,
        size=100,
        query={
            'query' : {
                'filtered' : q 
            }
        },
        query_params={
            'query_path' : 'hits.hits._source, hits.hits._score'
        }
    )

    # Iterate through results
    for doc_source in result.get('hits').get('hits'):
        doc = doc_source.get('_source')
        score = doc_source.get('_score')
        doc['score'] = score if score is not None else 1
        yield doc

    return result



class Line(object):
    'Auxiliary, for streaming CSV.'
    def __init__(self):    self._l = None
    def write(self, line): self._l = line
    def read(self):        return self._l



def generate_csv(documents, select=None, include_score=True):
    '''
    Generate a CSV file from the documents dictionary returned by
    ElasticSearch, selecting only those fields referenced in the iterator.
    '''

    fields = list(select or (field.name for field in data.fields))

    if include_score:
        fields.append('score')

    line = Line()
    writer = csv.writer(line)
    writer.writerow(fields)
    yield line.read()

    for doc in documents:
        writer.writerow(doc.get(field) for field in fields)
        yield line.read()


#print(''.join(line for line in generate_csv(search(),fields=['date'])))
