#!/usr/bin/env python3

import logging
logger = logging.getLogger(__name__)
from elasticsearch import Elasticsearch
import os
from datetime import datetime

from django.conf import settings

# everything based on corpora is broken
import corpora

es = Elasticsearch()
updated_docs = 0


def add_images(corpus_definition, page_size):
    index = corpus_definition.es_index
    corpus_dir = os.path.join(
        corpus_definition.data_directory, 'TDA_GDA', 'TDA_GDA_1785-2009')
    size = page_size
    scroll = settings.SERVERS['default']['scroll_timeout']

    # Collect initial page
    page = init_search(index, size, scroll)
    total_hits = page['hits']['total']
    scroll_size = len(page['hits']['hits'])

    logger.info("Starting collection of images for {} documents in index '{}'".format(
        total_hits, index))

    while scroll_size > 0:
        # Get the current scroll ID
        sid = page['_scroll_id']

        # Process current batch of hits
        process_hits(page['hits']['hits'], index, corpus_dir)

        # Scroll to next page
        page = es.scroll(scroll_id=sid, scroll=scroll)

        # Get the number of results in current page to control loop
        scroll_size = len(page['hits']['hits'])

    global updated_docs
    logger.info("Updated {} documents".format(updated_docs))


def init_search(index, size, scroll):
    return es.search(
        index=index,
        body={"_source": ["date", "page"]},
        params={"scroll": scroll, "size": size}
    )


def process_hits(hits, index, corpus_dir):
    for doc in hits:
        date, page = doc['_source']['date'], doc['_source']['page']
        es_doc_id = doc['_id']
        image_path = compose_image_path(date, page, corpus_dir)
        if image_path:
            update_document(index, es_doc_id, image_path)


def compose_image_path(date_string, page, corpus_dir):
    date_obj = datetime.strptime(date_string, '%Y-%m-%d')
    year, month, day = str(date_obj.year), '{0:02d}'.format(
        date_obj.month), "{0:02d}".format(date_obj.day)
    # issue_dir = year + month + day
    page_str = '{0:04d}'.format(int(page))
    file_name = '0FFO-{}-{}{}-{}'.format(year, month, day, page_str)+'.png'
    relative_path = os.path.join(year, year+month+day, file_name)
    complete_path = os.path.join(corpus_dir, relative_path)
    if os.path.isfile(complete_path):
        return os.path.join('TDA_GDA', 'TDA_GDA_1785-2009', relative_path)
    else:
        return None


def update_document(index, doc_type, doc_id, image_path):
    body = {"doc": {"image_path": image_path}}
    es.update(index=index, doc_type=doc_type, id=doc_id, body=body)
    logger.info("Updated document with id '{}'".format(doc_id))
    global updated_docs
    updated_docs += 1


if __name__ == "__main__":
    logfile = 'times_add_scans'
    logging.basicConfig(filename=logfile, level=settings.LOG_LEVEL)
    logger.info('Starting adding scans to ES index')
    this_corpus = corpora.DEFINITIONS['times']
    add_images(this_corpus, 100)
