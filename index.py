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
    
    if clear:
        logging.info('Attempting to clean old index...')
        client.indices.delete(index=corpus.ES_INDEX, ignore=[400, 404])

    logging.info('Attempting to create index...')
    client.indices.create(
        index=corpus.ES_INDEX, 
        body={
            'mappings' : {
                corpus.ES_DOCTYPE : {
                    'properties': {
                        field.name : field.mapping
                        for field in corpus.fields
                        if field.mapping and field.indexed
                    }
                }
            }
        },
        ignore=400
    )


def populate(client, corpus, start=None, end=None):
    
    logging.info('Attempting to populate index...')
    files = corpus.files(start or corpus.MIN_DATE, end or corpus.MAX_DATE)
    docs = corpus.documents(files)
    actions = (
        dict(doc, **{
            '_op_type' : 'index',
            '_index' : corpus.ES_INDEX,
            '_type' : corpus.ES_DOCTYPE,
            '_id' : doc.pop('id'),
            'doc' : doc
        })
        for doc in docs
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
    create(client, corpus, clear=clear)
    client.cluster.health(wait_for_status='yellow')
    populate(client, corpus, start=start, end=end)


if __name__ == '__main__':

    try:
        corpus = corpora[sys.argv[1]]
        start = datetime.strptime(sys.argv[2], '%Y-%m-%d')
        end = datetime.strptime(sys.argv[3], '%Y-%m-%d')
    except Exception:
        logging.critical('Missing or incorrect arguments. Example call: ./index.py times 1785-01-01 2010-12-31')
        raise
    
    client = factories.elasticsearch()
    logging.basicConfig(filename='indexing-{}-{}.log'.format(start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')), level=config.LOG_LEVEL)
    
    logging.info('Started indexing `{}` from {} to {}...'.format(
        corpus.ES_INDEX,
        start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')
    ))
    
    index(client, corpus, start=start, end=end)
    logging.info('Finished indexing `{}`.'.format(corpus.ES_INDEX))
