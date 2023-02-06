from celery import shared_task, group, chain
from django.conf import settings
from visualization import wordcloud, ngram, term_frequency
from es import download as es_download

@shared_task()
def get_wordcloud_data(request_json):
    list_of_texts, _ = es_download.scroll(request_json['corpus'], request_json['es_query'], settings.WORDCLOUD_LIMIT)
    word_counts = wordcloud.make_wordcloud_data(list_of_texts, request_json['field'], request_json['corpus'])
    return word_counts

'''Temporary test task'''
@shared_task
def add(x, y):
    return x + y

@shared_task()
def get_ngram_data(request_json):
    return ngram.get_ngrams(
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

@shared_task()
def get_histogram_term_frequency_bin(es_query, corpus_name, field_name, field_value, size, include_query_in_result = False):
    '''
    Calculate the value for a single series + bin in the histogram term frequency
    graph.
    '''
    return term_frequency.get_aggregate_term_frequency(
        es_query, corpus_name, field_name, field_value, size,
        include_query_in_result = include_query_in_result
    )

def histogram_term_frequency_tasks(request_json, include_query_in_result = False):
    '''
    Calculate values for an entire series in the histogram term frequency graph.
    Schedules one task for each bin, which can be run in parallel.
    '''
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

@shared_task()
def get_timeline_term_frequency_bin(es_query, corpus_name, field_name, start_date, end_date, size, include_query_in_result = False):
    '''
    Calculate the value for a single series + bin in the timeline term frequency
    graph.
    '''
    return term_frequency.get_date_term_frequency(
        es_query, corpus_name, field_name, start_date, end_date, size,
        include_query_in_result = include_query_in_result
    )

def timeline_term_frequency_tasks(request_json, include_query_in_result = False):
    '''
    Calculate values for an entire series in the timeline term frequency graph.
    Schedules one task for each bin, which can be run in parallel.
    '''

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
