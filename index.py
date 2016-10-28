#!/usr/bin/env python3

'''
Script to index the data into ElasticSearch.
'''

import logging
import pyelasticsearch as es
from datetime import datetime

import config
import factories
import data

def index(client, start=None, end=None):

    # Create index
    try:
        client.create_index(config.ES_INDEX)
    except es.exceptions.IndexAlreadyExistsError:
        logging.warning('Index "{}" already exists'.format(config.ES_INDEX))
        pass

    # Create mapping
    client.put_mapping(mapping={
        'properties' : {
            field.name : field.mapping
            for field in data.fields if field.mapping and field.indexed
        }
    }, index=config.ES_INDEX, doc_type=config.ES_DOCTYPE)

    # Index all documents
    files = data.datafiles(start or config.MIN_DATE, end or config.MAX_DATE)
    docs = data.documents(files)
    for chunk in es.bulk_chunks(
            map(client.index_op, docs),
            docs_per_chunk=500,
            bytes_per_chunk=40000
        ):
        client.bulk(chunk, index=config.ES_INDEX, doc_type=config.ES_DOCTYPE)

    # Make sure the index is all updated
    client.refresh(index=config.ES_INDEX)


if __name__ == '__main__':
    client = factories.elasticsearch()

    logging.basicConfig(level=logging.INFO)
    logging.info('Clearing old index...')
    client.delete_all(index=config.ES_INDEX, doc_type=config.ES_DOCTYPE)
    logging.info('Started indexing...')
    index(client, start=1785, end=datetime(1785,2,1))
    logging.info('Finished indexing.')
