#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import logging
import pyelasticsearch as es
from datetime import datetime

from timestextminer import config
from timestextminer import factories
from timestextminer.sources import times

def index(client, index, doc_type, module, start=None, end=None):
    '''
    module contains files(), fields and documents()
    '''
    
    # Create index
    try:
        client.create_index(index)
    except es.exceptions.IndexAlreadyExistsError:
        logging.warning('Index "{}" already exists'.format(index))
        pass

    # Create mapping
    client.put_mapping(mapping={
        'properties' : {
            field.name : field.mapping
            for field in module.fields if field.mapping and field.indexed
        }
    }, index=index, doc_type=doc_type)
    
    # Index all documents
    files = module.files(start or config.MIN_DATE, end or config.MAX_DATE)
    docs = module.documents(files)
    for chunk in es.bulk_chunks(
            map(client.index_op, docs),
            docs_per_chunk=500,
            bytes_per_chunk=40000
        ):
        client.bulk(chunk, index=index, doc_type=doc_type)

    # Make sure the index is all updated
    client.refresh(index=index)


if __name__ == '__main__':
   
    client = factories.elasticsearch()
    sources = [{
        'module': times,
        'index': config.ES_INDEX,
        'doc_type': config.ES_DOCTYPE
    }]

    for s in sources:
        logging.basicConfig(level=logging.INFO)
        logging.info('Index: {}'.format(s['index']))
        #logging.info('Clearing old index...')
        #client.delete_all(index=s['index'], doc_type=s['doc_type'])
        logging.info('Started indexing...')
        index(client, index=s['index'], doc_type=s['doc_type'], module=s['module'], start=1785, end=datetime(1785,2,1))
        logging.info('Finished indexing.')
