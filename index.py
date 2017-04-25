#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import sys
import logging
import elasticsearch as es
import elasticsearch.helpers as es_helpers

from datetime import datetime

from ianalyzer import config
from ianalyzer import factories
from ianalyzer.corpora import corpora



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
        body=corpus.es_mapping(),
        ignore=400
    )



def populate(client, corpus, start=None, end=None):
    '''
    Populate an ElasticSearch index from the corpus' source files.
    '''
    
    logging.info('Attempting to populate index...')
    
    # Obtain source documents
    files = corpus.sources(start or corpus.min_date, end or corpus.max_date)
    docs = corpus.documents(files)
    
    # Each source document is decorated as an indexing operation, so that it
    # can be sent to ElasticSearch in bulk
    actions = (
        {
            '_op_type' : 'index',
            '_index' : corpus.es_index,
            '_type' : corpus.es_doctype,
            '_id' : doc.pop('id'),
            '_source' : doc
        } for doc in docs
    )
    
    # Do bulk operation
    for result in es_helpers.bulk(
        client,
        actions,
        chunk_size=config.ES_CHUNK_SIZE,
        max_chunk_bytes=config.ES_MAX_CHUNK_BYTES,
        timeout=config.ES_BULK_TIMEOUT,
        stats_only=True, # We want to know how many documents were added
    ):
        logging.info('Indexed documents ({}).'.format(result))



if __name__ == '__main__':
    '''
    Enable indexing from the command line.
    '''
    
    # Read CLI arguments
    try:
        corpus = corpora[sys.argv[1]]
        if len(sys.argv) > 3:
            start = datetime.strptime(sys.argv[2], '%Y-%m-%d')
            end = datetime.strptime(sys.argv[3], '%Y-%m-%d')
        else:
            start = corpus.min_date
            end = corpus.max_date
    except Exception:
        logging.critical(
            'Missing or incorrect arguments. '
            'Example call: ./index.py times 1785-01-01 2010-12-31'
        )
        raise
    
    # Log to a specific file
    logfile = 'indexing-{}-{}.log'.format(
        start.strftime('%Y%m%d'),
        end.strftime('%Y%m%d')
    )
    logging.basicConfig(filename=logfile, level=config.LOG_LEVEL)
    logging.info('Started indexing `{}` from {} to {}...'.format(
        corpus.es_index,
        start.strftime('%Y-%m-%d'),
        end.strftime('%Y-%m-%d')
    ))
    
    # Create and populate the ES index
    client = factories.elasticsearch()
    create(client, corpus, clear=False)
    client.cluster.health(wait_for_status='yellow')
    populate(client, corpus, start=start, end=end)
    
    logging.info('Finished indexing `{}`.'.format(corpus.es_index))
