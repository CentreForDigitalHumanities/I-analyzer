from urllib import request
import requests
import json
from flask import Flask, abort, current_app, render_template, jsonify
from flask_mail import Mail, Message
import logging
from requests.exceptions import Timeout, ConnectionError, HTTPError
import re
import os

from api import analyze
from api.user_mail import send_user_mail
from api import query
from es import es_forward, download
from ianalyzer import celery_app
import api.cache as cache
from api import create_csv

logger = logging.getLogger(__name__)


@celery_app.task()
def download_scroll(request_json, download_size=10000):
    results, _ = download.scroll(request_json['corpus'], request_json['es_query'], download_size)
    return results


@celery_app.task()
def make_csv(results, request_json):
    query = create_query(request_json)
    filepath = create_csv.search_results_csv(results, request_json['fields'], query)
    return filepath


def create_query(request_json):
    """
    format the route of the search into a query string
    """
    route = request_json.get('route')
    return re.sub(r';|%\d+', '_', re.sub(r'\$', '', route.split('/')[2]))


@celery_app.task()
def get_wordcloud_data(request_json):
    def calculate():
        list_of_texts, _ = download.scroll(request_json['corpus'], request_json['es_query'], current_app.config['WORDCLOUD_LIMIT'])
        word_counts = analyze.make_wordcloud_data(list_of_texts, request_json['field'], request_json['corpus'])
        return word_counts

    return cache.make_visualization('wordcloud', request_json['corpus'], request_json, calculate)


@celery_app.task()
def get_ngram_data(request_json):
    def calculate():
        return analyze.get_ngrams(
            request_json['es_query'],
            request_json['corpus_name'],
            request_json['field'],
            ngram_size=request_json['ngram_size'],
            positions=request_json['term_position'],
            freq_compensation=request_json['freq_compensation'],
            subfield=request_json['subfield'],
            max_size_per_interval=request_json['max_size_per_interval'],
            number_of_ngrams=request_json['number_of_ngrams'],
            date_field = request_json['date_field']
        )

    corpus = request_json['corpus_name']
    result = cache.make_visualization('ngram', corpus, request_json, calculate)

    return result

@celery_app.task()
def get_histogram_term_frequency(request_json):
    corpus = request_json['corpus_name']
    bins = request_json['bins']

    def calculate():
        data = [
            analyze.get_aggregate_term_frequency(
                request_json['es_query'],
                corpus,
                request_json['field_name'],
                bin['field_value'],
                bin['size'],
            )
            for bin in bins
        ]
        return data

    result = cache.make_visualization('ngram', corpus, request_json, calculate)
    return result

@celery_app.task()
def histogram_term_frequency_full_data(parameters_per_series):
    query_per_series = [query.get_query_text(params['es_query']) for params in parameters_per_series]
    field_name = parameters_per_series[0]['field_name']
    results_per_series = map(get_histogram_term_frequency, parameters_per_series)
    filepath = create_csv.term_frequency_csv(query_per_series, results_per_series, field_name)
    return filepath


@celery_app.task()
def get_timeline_term_frequency(request_json):
    corpus = request_json['corpus_name']
    bins = request_json['bins']

    def calculate():
        data = [
            analyze.get_date_term_frequency(
                request_json['es_query'],
                corpus,
                request_json['field_name'],
                bin['start_date'],
                bin['end_date'],
                bin['size'],
            )
            for bin in bins
        ]
        return data

    result = cache.make_visualization('ngram', corpus, request_json, calculate)
    return result


@celery_app.task()
def timeline_term_frequency_full_data(parameters_per_series):
    query_per_series = [query.get_query_text(params['es_query']) for params in parameters_per_series]
    field_name = parameters_per_series[0]['field_name']
    unit = parameters_per_series[0]['unit']
    parameters_unlimited = map(remove_size_limit, parameters_per_series)
    results_per_series = list(map(get_timeline_term_frequency, parameters_unlimited))
    filepath = create_csv.term_frequency_csv(query_per_series, results_per_series, field_name, unit = unit)
    return filepath

def remove_size_limit(parameters):
    for bin in parameters['bins']:
        bin['size'] = None
    return parameters

@celery_app.task()
def csv_data_email(csv_filepath, user_email, username):
    _, filename = os.path.split(csv_filepath)
    send_user_mail(
        email=user_email,
        username=username,
        subject_line="I-Analyzer CSV download",
        email_title="Download CSV",
        message="Your .csv file is ready for download.",
        prompt="Click on the link below.",
        link_url=current_app.config['BASE_URL'] + "/api/csv/" + filename, #this is the route defined for csv download in views.py
        link_text="Download .csv file"
    )
