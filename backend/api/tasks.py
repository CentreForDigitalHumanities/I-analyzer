import requests
import csv
import json
import os.path as op
from flask import Flask, abort, current_app, render_template
from flask_mail import Mail, Message
import logging
from requests.exceptions import Timeout, ConnectionError, HTTPError
import re
from bs4 import BeautifulSoup

from api import analyze
from api.user_mail import send_user_mail
from es import es_forward, download
from ianalyzer import celery_app

logger = logging.getLogger(__name__)


@celery_app.task()
def download_scroll(request_json, download_size=10000):
    results = download.scroll(request_json['corpus'], request_json['es_query'], download_size)
    return results


@celery_app.task()
def make_csv(results, request_json):
    query = create_query(request_json)
    filepath = create_csv(results, request_json['fields'], query)
    return filepath


@celery_app.task()
def get_wordcloud_data(request_json):
    list_of_texts = download.scroll(request_json['corpus'], request_json['es_query'], current_app.config['WORDCLOUD_LIMIT'])
    return list_of_texts


@celery_app.task()
def make_wordcloud_data(list_of_texts, request_json):
    word_counts = analyze.make_wordcloud_data(list_of_texts, request_json['field'])
    return word_counts

@celery_app.task()
def get_ngram_data(request_json):
    results = analyze.get_ngrams(
        request_json['es_query'],
        request_json['corpus_name'],
        request_json['field'],
        ngram_size=request_json['ngram_size'],
        term_positions=request_json['term_position'],
        freq_compensation=request_json['freq_compensation'],
        subfield=request_json['subfield'],
        max_size_per_interval=request_json['max_size_per_interval'],
        number_of_ngrams=request_json['number_of_ngrams']
    )
    return results

def create_query(request_json):
    """
    format the route of the search into a query string
    """
    route = request_json.get('route')
    return re.sub(r';|%\d+', '_', re.sub(r'\$', '', route.split('/')[2]))


def create_filename(query):
    """
    name the file given the route of the search
    cut the file name to max length of 255 (including route and extension)
    """
    max_filename_length = 251-len(current_app.config['CSV_FILES_PATH'])
    filename = query[:min(max_filename_length, len(query))]
    filename += '.csv'
    return filename


def create_csv(results, fields, query):
    entries = []
    field_set = set(fields)
    field_set.update(['query'])
    for result in results:
        entry={'query': query}
        for field in fields:
            #this assures that old indices, which have their id on
            #the top level '_id' field, will fill in id here
            if field=="id" and "_id" in result:
                entry.update( {field: result['_id']} )
            if field in result['_source']:
                entry.update( {field:result['_source'][field]} )
        highlights = result.get('highlight')
        if 'context' in fields and highlights:
            hi_fields = highlights.keys()
            for hf in hi_fields:
                for index, hi in enumerate(highlights[hf]):
                    highlight_field_name = '{}_qic_{}'.format(hf, index+1)
                    field_set.update([highlight_field_name])
                    soup = BeautifulSoup(hi, 'html.parser')
                    entry.update({highlight_field_name: soup.get_text()})
        entries.append(entry)
    csv.register_dialect('myDialect', delimiter=';', quotechar='"',
                         quoting=csv.QUOTE_NONNUMERIC, skipinitialspace=True)
    filename = create_filename(query)
    filepath = op.join(current_app.config['CSV_FILES_PATH'], filename)
    field_set.discard('context')
    # newline='' to prevent empty double lines
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=sorted(field_set), dialect='myDialect')
        writer.writeheader()
        for row in entries:
            writer.writerow(row)
    return filepath
