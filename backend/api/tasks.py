from urllib import request
import requests
import json
from flask import Flask, abort, current_app, render_template
from flask_mail import Mail, Message
import logging
from requests.exceptions import Timeout, ConnectionError, HTTPError
import re

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
    results = download.scroll(request_json['corpus'], request_json['es_query'], download_size)
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
        list_of_texts = download.scroll(request_json['corpus'], request_json['es_query'], current_app.config['WORDCLOUD_LIMIT'])
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
    query_model_per_series = [params['es_query'] for params in parameters_per_series]
    query_per_series = map(query.get_query_text, query_model_per_series)
    results_per_series = map(get_histogram_term_frequency, parameters_per_series)
    filepath = create_csv.histogram_term_frequency_csv(query_per_series, results_per_series)
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
    query_model_per_series = [params['es_query'] for params in parameters_per_series]
    query_per_series = map(query.get_query_text, query_model_per_series)
    results_per_series = map(get_timeline_term_frequency, parameters_per_series)
    filepath = create_csv.timeline_term_frequency_csv(query_per_series, results_per_series)
    return filepath
