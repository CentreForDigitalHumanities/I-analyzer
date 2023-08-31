from celery import chain, group, shared_task
from django.conf import settings
from visualization import wordcloud, ngram, term_frequency
from es import download as es_download

@shared_task()
def get_wordcloud_data(request_json):
    list_of_texts, _ = es_download.scroll(request_json['corpus'], request_json['es_query'], settings.WORDCLOUD_LIMIT)
    word_counts = wordcloud.make_wordcloud_data(list_of_texts, request_json['field'], request_json['corpus'])
    return word_counts

@shared_task()
def get_ngram_per_data_bin(request_json):
    return ngram.get_ngrams(
        request_json['field'],
        ngram_size=request_json['ngram_size'],
        positions=request_json['term_position'],
        freq_compensation=request_json['freq_compensation'],
        subfield=request_json['subfield'],
        max_size_per_interval=request_json['max_size_per_interval'],
        number_of_ngrams=request_json['number_of_ngrams'],
        date_field = request_json['date_field']
    )

def get_ngram_data(request_json):
    es_query = request_json['es_query']
    corpus = request_json['corpus_name']
    bins = ngram.get_time_bins(es_query, corpus)
    freq_compensation=request_json['freq_compensation'],
    return chain(group([
        ngram.tokens_by_time_interval.s(
            corpus,
            es_query,
            field=request_json['field'],
            bin=time_bin,
            ngram_size=request_json['ngram_size'],
            term_position=request_json['term_position'],
            freq_compensation=freq_compensation,
            subfield=request_json['subfield'],
            max_size_per_interval=request_json['max_size_per_interval'],
            date_field=request_json['date_field']
        ) for time_bin in bins
    ]), ngram.get_ngrams(
        bins,
        freq_compensation=freq_compensation,
        number_of_ngrams=request_json['number_of_ngrams']))

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
