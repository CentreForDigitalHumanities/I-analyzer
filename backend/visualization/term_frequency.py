import numpy as np
from sklearn.metrics import auc

from addcorpus.load_corpus import load_corpus
from datetime import datetime
from es.search import get_index, hits, total_hits, search
from ianalyzer.elasticsearch import elasticsearch
from copy import deepcopy
from visualization import query, termvectors
from es import download

NUM_COLLECTED_DOCUMENTS = 5000
NUM_SAMPLES = 50
SAMPLING_EXP = 2.18

def parse_datestring(datestring):
    return datetime.strptime(datestring, '%Y-%m-%d')

def get_date_term_frequency(es_query, corpus, field, start_date_str, end_date_str = None, size = 100, include_query_in_result = False):

    start_date = parse_datestring(start_date_str)
    end_date = parse_datestring(end_date_str) if end_date_str else None

    date_filter = query.make_date_filter(start_date, end_date, date_field = field)
    es_query = query.add_filter(es_query, date_filter)
    query_text = query.get_query_text(es_query)

    match_count, doc_count, token_count = get_term_frequency(es_query, corpus, size)

    data = {
        'key': start_date_str,
        'key_as_string': start_date_str,
        'total_doc_count': doc_count,
        'match_count': match_count,
        'token_count': token_count,
    }

    if include_query_in_result:
        data['query'] = query_text

    return data

def extract_data_for_term_frequency(corpus, es_query):
    corpus_class = load_corpus(corpus)
    search_fields = query.get_search_fields(es_query)
    if search_fields:
        fields = list(filter(lambda field: field.name in search_fields, corpus_class.fields))
    else:
        fields =list(filter(lambda field: field.es_mapping['type'] == 'text', corpus_class.fields))

    fieldnames = [field.name for field in fields]

    has_length_count = lambda field: 'fields' in field.es_mapping and 'length' in field.es_mapping['fields']
    include_token_count = all(has_length_count(field) for field in fields)

    if include_token_count:
        token_count_aggregators = {
            'token_count_' + field.name: {
                'sum': {
                    'field': field.name + '.length'
                }
            }
            for field in fields
        }
    else:
        token_count_aggregators = None

    return fieldnames, token_count_aggregators

def get_match_count(es_client, es_query, corpus, size, fieldnames, num_samples=NUM_SAMPLES):
    search_result = search(
        corpus, es_query, client=es_client, size=size, source=[], track_total_hits=True
    )
    found_hits = hits(search_result)

    if not len(found_hits):
        return 0

    # analyze all data if there are less hits than NUM_SAMPLES
    # otherwise, sample at exponential intervals (chosen to cover up to NUM_COLLECTED_DOCUMENTS)
    sampling_interval = lambda x: int(x**SAMPLING_EXP)

    sample_points = (
        range(len(found_hits)) if len(found_hits) <= num_samples
        else [sampling_interval(i) for i in range(0, num_samples) if sampling_interval(i) < len(found_hits)]
    )

    index = get_index(corpus)
    query_text = query.get_query_text(es_query)
    matches = [
        count_matches_in_document(found_hits[sample_index]['_id'], index, fieldnames, query_text, es_client)
        for sample_index in sample_points if sample_index < len(found_hits)
    ]

    if len(found_hits) <= num_samples:
        # all data was analyzed, sum it
        return sum(matches)

    # otherwise, make an estimate based on sample points
    # create x-y coordinates - the last result is expected to contain 1 match
    x = np.array([*sample_points, total_hits(search_result)])
    y = np.array([*matches, 1])

    # get the Area Under Curve, using the trapezoid rule
    match_estimate = auc(x,y)

    return int(match_estimate)

def count_matches_in_document(id, index, fieldnames, query_text, es_client):
    # get the term vectors for the hit
    result = es_client.termvectors(
        index=index,
        id=id,
        fields = fieldnames
    )

    # whether the query contains multi-word phrases
    match_phrases = '"' in query_text

    matches = 0

    for field in fieldnames:
        terms = termvectors.get_terms(result, field)
        tokens = termvectors.get_tokens(terms, sort=match_phrases)
        matches += sum(1 for match in termvectors.token_matches(tokens, query_text, index, field, es_client))

    return matches


def get_total_docs_and_tokens(es_client, query, corpus, token_count_aggregators):
    if token_count_aggregators:
        query['aggs'] = token_count_aggregators

    results = search(
        corpus = corpus,
        query_model = query,
        size = 0, # don't include documents
        track_total_hits = True
    )

    total_doc_count = total_hits(results)

    if token_count_aggregators:
        token_count = int(sum(
            results['aggregations'][counter]['value']
            for counter in results['aggregations'] if counter.startswith('token_count')
        ))
    else:
        token_count = None

    return total_doc_count, token_count

def get_term_frequency(es_query, corpus, size):
    client = elasticsearch(corpus)

    # field specifications (used for counting hits), and token count aggregators (for total word count)
    fieldnames, token_count_aggregators = extract_data_for_term_frequency(corpus, es_query)

    # count number of matches
    match_count = get_match_count(client, deepcopy(es_query), corpus, size, fieldnames)

    # get total document count and (if available) token count for bin
    agg_query = query.remove_query(es_query) #remove search term filter
    total_doc_count, token_count = get_total_docs_and_tokens(client, agg_query, corpus, token_count_aggregators)

    return match_count, total_doc_count, token_count

def get_aggregate_term_frequency(es_query, corpus, field_name, field_value, size=NUM_COLLECTED_DOCUMENTS, include_query_in_result = False):
    # filter for relevant value
    term_filter = query.make_term_filter(field_name, field_value)
    es_query = query.add_filter(es_query, term_filter)
    query_text = query.get_query_text(es_query)

    match_count, doc_count, token_count = get_term_frequency(es_query, corpus, size)

    result = {
        'key': field_value,
        'match_count': match_count,
        'total_doc_count': doc_count,
        'token_count': token_count,
    }

    if include_query_in_result:
        result['query'] = query_text

    return result
