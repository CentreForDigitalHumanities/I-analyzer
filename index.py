#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import sys
import logging
import pyelasticsearch as es
from datetime import datetime

from timestextminer import config
from timestextminer import factories
from timestextminer.corpora import corpora

def create(client, corpus, clear=False):
    
    
    if clear:
        logging.info('Clearing old index...')
        try:
            client.delete_all(index=corpus.ES_INDEX, doc_type=corpus.ES_DOCTYPE)
        except es.exceptions.ElasticHttpError:
            logging.info('No index existed yet.')
        else:
            logging.info('Old index cleared.')

    try:
        client.create_index(corpus.ES_INDEX)
    except es.exceptions.ElasticHttpError:
        logging.warning('Index `{}` already exists'.format(corpus.ES_INDEX))
    else:
        # Create mapping
        client.put_mapping(mapping={
            'properties' : {
                field.name : field.mapping
                for field in corpus.fields if field.mapping and field.indexed
            }
        }, index=corpus.ES_INDEX, doc_type=corpus.ES_DOCTYPE)



def populate(client, corpus, start=None, end=None):
    files = corpus.files(start or corpus.MIN_DATE, end or corpus.MAX_DATE)
    docs = corpus.documents(files)

    for chunk in es.bulk_chunks(
            map(client.index_op, docs),
            docs_per_chunk=1000,
            bytes_per_chunk=5 * 1024 * 1024
        ):
        print('chunk!')
        client.bulk(chunk, index=corpus.ES_INDEX, doc_type=corpus.ES_DOCTYPE)
    # See page 43 for document already exists errors. does ID interfere..?

def index(client, corpus, start=None, end=None, clear=False):
    create(client, corpus, clear=clear)
    populate(client, corpus, start=start, end=end)
    client.refresh(index=corpus.ES_INDEX)


if __name__ == '__main__':
    '''
    Call as follows:
    ./index.py times 1785-01-01 2010-12-31
    '''
    
    corpus = corpora[sys.argv[1]]
    start = datetime.strptime(sys.argv[2], '%Y-%m-%d')
    end = datetime.strptime(sys.argv[3], '%Y-%m-%d')
    
    client = factories.elasticsearch()
    logging.basicConfig(filename=None and 'indexing-{}-{}.log'.format(start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')), level=config.LOG_LEVEL)
    
    logging.info('Started indexing `{}` from {} to {}...'.format(
        corpus.ES_INDEX,
        start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')
    ))
    
    index(client, corpus, start=start, end=start)
    logging.info('Finished indexing `{}`.'.format(corpus.ES_INDEX))
