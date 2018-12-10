#!/usr/bin/env python3

import logging
from elasticsearch import Elasticsearch
from ianalyzer import config_fallback as config
from ianalyzer import corpora
import os.path as op
import os
import re
from bs4 import BeautifulSoup as bs

es = Elasticsearch()


def add_images(corpus):
    for directory, _, filenames in os.walk(corpus.data_directory):
        rel_dir = op.relpath(directory, corpus.data_directory)
        for filename in filenames:
            name, extension = op.splitext(filename)
            full_path = op.join(directory, filename)
            if extension != '.xml':
                # logger.debug(self.non_xml_msg.format(full_path))
                continue
            information = re.split("_", name)
            # financial folders contain multiple xmls, ignore the abby files
            if information[-1] == "abby" or len(information[-1]) > 5:
                continue
            company = information[0]
            if not re.match("[a-zA-Z]+", information[1]):
                # second part of file name is part of company name
                company = "_".join([company, information[1]])
                # using first four-integer string in the file name as year
            years = re.compile("[0-9]{4}")
            year = next((int(info) for info in information
                         if re.match(years, info)), None)

            scan_filename = name + '.pdf'
            full_scan_path = op.join(rel_dir, scan_filename)

            with open(full_path) as f:
                soup = bs(f.read(), "lxml")
                pages = soup.findAll('page')

            doc_ids = ['{}_{}_'.format(
                company, year) + p.attrs['id'] for p in pages]
            for es_id in doc_ids:
                update_doc(corpus, es_id, full_scan_path)
                pass


def update_doc(corpus, es_id, full_scan_path):
    print('Updating {}'.format(es_id))
    body = {"doc": {"image_path": full_scan_path}}
    es.update(index=corpus.es_index,
              doc_type=corpus.es_doctype, id=es_id, body=body)


if __name__ == "__main__":
    logfile = 'db_add_scans'
    logging.basicConfig(filename=logfile, level=config.LOG_LEVEL)
    logging.info('Starting adding scans to ES index')
    this_corpus = corpora.DEFINITIONS['dutchbanking']
    add_images(this_corpus)
