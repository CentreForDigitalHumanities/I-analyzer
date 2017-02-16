#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import sys
import logging
import elasticsearch as es
import elasticsearch.helpers as es_helpers

from datetime import datetime

from timestextminer import config
from timestextminer import factories
from timestextminer.corpora import corpora

def create(client, corpus, clear=False):
    '''
    Initialise an ElasticSearch index.
    '''
    
    if clear:
        logging.info('Attempting to clean old index...')
        client.indices.delete(index=corpus.es_index, ignore=[400, 404])

    logging.info('Attempting to create index...')
    client.indices.create(
        index=corpus.es_index, 
        body=corpus.es_mapping,
        ignore=400
    )



def populate(client, corpus, start=None, end=None):
    '''
    Populate an ElasticSearch index from the corpus' source files.
    '''
    
    logging.info('Attempting to populate index...')
    files = corpus.files(start or corpus.min_date, end or corpus.max_date)
    docs = corpus.documents(files)
    
    # Each source document is passed to an indexing action, so that it can be
    # sent to ElasticSearch in bulk
    actions = (
        {
            '_op_type' : 'index',
            '_index' : corpus.es_index,
            '_type' : corpus.es_doctype,
            '_id' : doc.pop('id'),
            'doc' : doc
        } for doc in docs
    )
    
    for result in es_helpers.bulk(
        client,
        actions,
        chunk_size=900,
        max_chunk_bytes=1*1024*1024,
        timeout='60s',
        stats_only=True,
        refresh=True
    ):
        logging.info('Indexed documents ({}).'.format(result))



def index(client, corpus, start=None, end=None, clear=False):
    '''
    Create and populate an ElasticSearch index.
    '''
    
    create(client, corpus, clear=clear)
    client.cluster.health(wait_for_status='yellow')
    populate(client, corpus, start=start, end=end)



if __name__ == '__main__':
    '''
    Enable indexing from the command line.
    '''
    
    try:
        corpus = corpora[sys.argv[1]]
        start = datetime.strptime(sys.argv[2], '%Y-%m-%d')
        end = datetime.strptime(sys.argv[3], '%Y-%m-%d')
    except Exception:
        logging.critical(
            'Missing or incorrect arguments. '
            'Example call: ./index.py times 1785-01-01 2010-12-31'
        )
        raise
    
    client = factories.elasticsearch()
    logging.basicConfig(filename='indexing-{}-{}.log'.format(start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')), level=config.LOG_LEVEL)
    
    logging.info('Started indexing `{}` from {} to {}...'.format(
        corpus.ES_INDEX,
        start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')
    ))
    
    index(client, corpus, start=start, end=end)
    logging.info('Finished indexing `{}`.'.format(corpus.es_index))
