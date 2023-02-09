from flask import current_app
import logging
import re
import os

from api import analyze, query, download as api_download
from api.user_mail import send_user_mail
from es import download as es_download
from ianalyzer import celery_app
from api import create_csv
from celery import chain, group

logger = logging.getLogger(__name__)

def download_search_results(request_json, user):
    download_limit = user.download_limit
    corpus_name = request_json['corpus']

    log_id = api_download.store_download_started('search_results', corpus_name, request_json, user.id)

    return chain(
        download_scroll.s(request_json, download_limit),
        make_csv.s(request_json),
        complete_download.s(log_id),
        csv_data_email.s(user.email, user.username),
    ).on_error(complete_failed_download.s(log_id))

@celery_app.task()
def get_wordcloud_data(request_json):
    list_of_texts, _ = es_download.scroll(request_json['corpus'], request_json['es_query'], current_app.config['WORDCLOUD_LIMIT'])
    word_counts = analyze.make_wordcloud_data(list_of_texts, request_json['field'], request_json['corpus'])
    return word_counts



@celery_app.task()
def get_ngram_data(request_json):
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

@celery_app.task()
def get_histogram_term_frequency_bin(es_query, corpus_name, field_name, field_value, size, include_query_in_result = False):
    return analyze.get_aggregate_term_frequency(
        es_query, corpus_name, field_name, field_value, size,
        include_query_in_result = include_query_in_result
    )

def histogram_term_frequency_tasks(request_json, include_query_in_result = False):
    corpus = request_json['corpus_name']
    bins = request_json['bins']

    return group([
        get_histogram_term_frequency_bin.s(
            request_json['es_query'],
            corpus,
            request_json['field_name'],
            bin['field_value'],
            bin['size'],
            include_query_in_result = include_query_in_result
        )
        for bin in bins
    ])

@celery_app.task()
def make_term_frequency_csv(results_per_series, parameters_per_series):
    query_per_series, field_name, unit = extract_term_frequency_download_metadata(parameters_per_series)
    return create_csv.term_frequency_csv(query_per_series, results_per_series, field_name, unit = unit)


@celery_app.task()
def get_timeline_term_frequency_bin(es_query, corpus_name, field_name, start_date, end_date, size, include_query_in_result = False):
    return analyze.get_date_term_frequency(
        es_query, corpus_name, field_name, start_date, end_date, size,
        include_query_in_result = include_query_in_result
    )

def timeline_term_frequency_tasks(request_json, include_query_in_result = False):
    corpus = request_json['corpus_name']
    bins = request_json['bins']

    return group(
        get_timeline_term_frequency_bin.s(
            request_json['es_query'],
            corpus,
            request_json['field_name'],
            bin['start_date'],
            bin['end_date'],
            bin['size'],
            include_query_in_result = include_query_in_result
        )
        for bin in bins
    )

def term_frequency_full_data_tasks(parameters_per_series, visualization_type):
    parameters_unlimited = map(remove_size_limit, parameters_per_series)
    task_function = histogram_term_frequency_tasks if visualization_type == 'aggregate_term_frequency' else timeline_term_frequency_tasks
    return group(
        task_function(series_parameters, True) for series_parameters in parameters_unlimited
    )

def extract_term_frequency_download_metadata(parameters_per_series):
    query_per_series = [query.get_query_text(params['es_query']) for params in parameters_per_series]
    field_name = parameters_per_series[0]['field_name']
    unit = parameters_per_series[0].get('unit')
    return query_per_series, field_name, unit

def remove_size_limit(parameters):
    for bin in parameters['bins']:
        bin['size'] = None
    return parameters

@celery_app.task()
def csv_data_email(log_id, user_email, username):
    logger.info('should now be sending email')
    filename = api_download.get_result_filename(log_id)
    link_url = current_app.config['BASE_URL'] + '/api/csv/{}'.format(log_id) #this is the route defined for csv download in views.py
    send_user_mail(
        email=user_email,
        username=username,
        subject_line="I-Analyzer CSV download",
        email_title="Download CSV",
        message=f"Your file '{filename}' is ready for download.",
        prompt="Click on the link below.",
        link_url=link_url,
        link_text="Download .csv file"
    )


def download_full_data(request_json, user):
    visualization_type = request_json['visualization']

    task_per_type = {
        'date_term_frequency': term_frequency_full_data_tasks,
        'aggregate_term_frequency': term_frequency_full_data_tasks
    }

    parameters = request_json['parameters']
    corpus_name = request_json['corpus']
    task = task_per_type[visualization_type](parameters, visualization_type)

    log_id = api_download.store_download_started(visualization_type, corpus_name, parameters, user.id)

    return chain(
        task,
        make_term_frequency_csv.s(parameters),
        complete_download.s(log_id),
        csv_data_email.s(user.email, user.username),
    ).on_error(complete_failed_download.s(log_id))
