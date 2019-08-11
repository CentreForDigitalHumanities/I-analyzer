#!/usr/bin/env python3

import sys
from progress.bar import Bar
from datetime import datetime
import os
from elasticsearch import Elasticsearch
import logging
logger = logging.getLogger(__name__)


updated_docs = 0
bar = None

BASE_DIR = '/its/times/TDA_GDA/TDA_GDA_1785-2009'
LOG_LOCATION = '/home/jvboheemen/convert_scripts'

START_YEAR = 1900
END_YEAR = 1960


class ProgressBar(Bar):
    message = 'Updating index'
    suffix = '%(percent).1f%% - %(eta)ds'


def update_one_year(year, index, page_size, doc_type, corpus_dir, scroll):
    es = Elasticsearch()
    nr_of_docs = es.count(
        index=['times'],
        body={
            "query": {
                "bool": {
                    "must": {
                        "range": {
                            "date": {
                                "gte": "{}-01-01".format(year),
                                "lte": "{}-12-31".format(year)
                            }
                        }
                    }
                },
            }
        }
    )['count']

    # progress bar
    global bar
    bar = ProgressBar(max=nr_of_docs)

    # Collect initial page
    page = init_search(es, index, doc_type, page_size,
                       scroll, year)
    total_hits = page['hits']['total']
    scroll_size = len(page['hits']['hits'])

    logging.warning("Starting collection of images for {} documents in index '{}', year {}".format(
        total_hits, index, year))

    while scroll_size > 0:
        # Get the current scroll ID
        sid = page['_scroll_id']
        # Process current batch of hits
        process_hits(page['hits']['hits'], es, index, doc_type, corpus_dir)
        # Scroll to next page
        page = es.scroll(scroll_id=sid, scroll=scroll)
        # Get the number of results in current page to control loop
        scroll_size = len(page['hits']['hits'])

    bar.finish()
    global updated_docs
    logging.warning(
        "Updated {}/{} documents for year {}.".format(updated_docs, total_hits, year))
    updated_docs = 0


def add_images(page_size, start_year, end_year):
    index = 'times'
    doc_type = 'article'
    corpus_dir = BASE_DIR
    scroll = '3m'

    if end_year == start_year:
        update_one_year(start_year, index, page_size,
                        doc_type, corpus_dir, scroll)
    else:
        for year in range(start_year, end_year):
            update_one_year(year, index, page_size,
                            doc_type, corpus_dir, scroll)


def init_search(es, index, doc_type, page_size, scroll_timeout, year):
    return es.search(
        index=[index],
        body={
            "_source": ["date", "page"],
            "query": {
                "bool": {
                    "must": {
                        "range": {
                            "date": {
                                "gte": "{}-01-01".format(year),
                                "lte": "{}-12-31".format(year)
                            }
                        }
                    }
                },
            }
        },
        doc_type=doc_type,
        params={"scroll": scroll_timeout, "size": page_size}
    )


def process_hits(hits, es, index, doc_type, corpus_dir):
    for doc in hits:
        date, page = doc['_source']['date'], doc['_source']['page']
        es_doc_id = doc['_id']
        try:
            image_path = compose_image_path(date, page, corpus_dir)
            if image_path:
                update_document(es, index, doc_type, es_doc_id, image_path)
        except Exception as e:
            page = page if page is not None else 'Unknown'
            date = date if date is not None else 'Unknown'
            logging.warning('Error updating doc {}. Date: {}, page: {}'.format(
                doc['_id'], date, page))
            logging.warning(e)
        global bar
        bar.next()


def compose_image_path(date_string, page, corpus_dir):
    '''
    Up to and including 1985: 0FFO-1985-JAN02-001
    After 1985: 0FFO-1985-0102-001
    '''
    date_obj = datetime.strptime(date_string, '%Y-%m-%d')
    year, month, day = str(date_obj.year), '{0:02d}'.format(
        date_obj.month), "{0:02d}".format(date_obj.day)
    if int(year) > 1985:
        page_str = '{0:04d}'.format(int(page))
        file_name = '0FFO-{}-{}{}-{}'.format(year, month, day, page_str)+'.png'
    else:
        page_str = '{0:03d}'.format(int(page))
        file_name = '0FFO-{}-{}{}-{}'.format(year,
                                             date_obj.strftime('%b').upper(), day, page_str)+'.png'

    relative_path = os.path.join(year, year+month+day, file_name)
    complete_path = os.path.join(corpus_dir, relative_path)
    if os.path.isfile(complete_path):
        return os.path.join('TDA_GDA', 'TDA_GDA_1785-2009', relative_path)
    else:
        logging.warning('Image {} does not exist'.format(complete_path))
        return None


def update_document(es, index, doc_type, doc_id, image_path):
    body = {"doc": {"image_path": image_path}}
    es.update(index=index, doc_type=doc_type, id=doc_id, body=body)
    global updated_docs
    updated_docs += 1


if __name__ == "__main__":
    logfile = 'indexupdate.log'
    logging.basicConfig(filename=os.path.join(LOG_LOCATION, 'indexupdate.log'),
                        format='%(asctime)s\t%(levelname)s:\t%(message)s', datefmt='%c', level=logging.WARNING)
    add_images(100, START_YEAR, END_YEAR)
