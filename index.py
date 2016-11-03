#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import logging
import pyelasticsearch as es
from datetime import datetime

from timestextminer import config
from timestextminer import factories
from timestextminer.corpora import corpora

def index(client, corpus, start=None, end=None, clear=False):

    if clear:
        logging.info('Clearing old index...')
        try:
            client.delete_all(index=corpus.ES_INDEX, doc_type=corpus.ES_DOCTYPE)
        except es.exceptions.ElasticHttpNotFoundError:
            logging.info('Index did not exist yet.')
    
    try:
        client.create_index(corpus.ES_INDEX)
    except es.exceptions.IndexAlreadyExistsError:
        logging.warning('Index "{}" already exists'.format(corpus.ES_INDEX))

    # Create mapping
    client.put_mapping(mapping={
        'properties' : {
            field.name : field.mapping
            for field in corpus.fields if field.mapping and field.indexed
        }
    }, index=corpus.ES_INDEX, doc_type=corpus.ES_DOCTYPE)
    
    # Index all documents
    files = corpus.files(start or corpus.MIN_DATE, end or corpus.MAX_DATE)
    docs = corpus.documents(files)
    for chunk in es.bulk_chunks(
            map(client.index_op, docs),
            docs_per_chunk=500,
            bytes_per_chunk=40000
        ):
        client.bulk(chunk, index=corpus.ES_INDEX, doc_type=corpus.ES_DOCTYPE)

    # Make sure the index is all updated
    client.refresh(index=corpus.ES_INDEX)


if __name__ == '__main__':
   
    client = factories.elasticsearch()
    for name, corpus in corpora.items():
        logging.basicConfig(level=logging.INFO)
        logging.info('Started indexing `{}`...'.format(corpus.ES_INDEX))
        index(client, corpus, start=1785, end=datetime(1785,2,1), clear=True)
        index(client, corpus, start=datetime(2010,1,30), end=datetime(2010,1,30))
        logging.info('Finished indexing `{}`.'.format(corpus.ES_INDEX))
