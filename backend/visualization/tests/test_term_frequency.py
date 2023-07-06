import numpy as np
from sklearn.metrics import auc

from visualization import term_frequency, tasks
import csv


def test_extract_data_for_term_frequency(small_mock_corpus):
    es_query = make_query('test', ['content', 'title'])
    search_fields, aggregators = term_frequency.extract_data_for_term_frequency(small_mock_corpus, es_query)

    # fieldnames should look at specified fields
    target_fields = ['content', 'title']
    assert set(target_fields) == set(search_fields)

    # no .length multifield for all fields, so no aggregator
    assert aggregators == None

    # restrict the search field to one with token counts
    fields_with_token_counts = ['content']
    es_query = make_query('test', fields_with_token_counts)
    fieldnames, aggregators = term_frequency.extract_data_for_term_frequency(small_mock_corpus, es_query)

    # fieldnames should be restricted as well
    assert set(fields_with_token_counts) == set(fieldnames)

    # token count aggregator should be included
    aggregators_target = {
        'token_count_content': {
            'sum': {
                'field': 'content.length'
            }
        }
    }
    assert aggregators == aggregators_target

def test_match_count(small_mock_corpus, es_client, index_small_mock_corpus):
    """Test counting matches of the search term"""

    frequencies = [
        ('Alice', 2), # 1 in alice in wonderland title, 1 in its content
        ('rejoice', 1), # 1 in content of frankenstein
        ('evil forebodings', 2), # multiword, each occurs once
        ('evil + forebodings', 2), # + does nothing
        ('"evil forebodings"', 1), # 1 match for prhase
        ('"Alice in Wonderland" Frankenstein', 2),
        ('of', 5), # matches in multiple documents
        ('of Alice', 7),
        ('of + Alice', 4), # only get hits for 'of' in documents that also contain 'Alice'
        ('rejuice~1', 1), #fuzzy match
        ('hav*', 2), # wildcard match
        ('sit* hav*' , 3),
        ('nomatches', 0),
    ]

    for text, freq in frequencies:
        query = make_query(query_text=text)
        fieldnames, aggregators = term_frequency.extract_data_for_term_frequency(small_mock_corpus, query)
        match_count = term_frequency.get_match_count(es_client, query, small_mock_corpus, 100, fieldnames)
        assert match_count == freq

def test_match_count_estimate(es_client_m_hits, es_client_k_hits, small_mock_corpus, basic_query):
    matches = term_frequency.get_match_count(es_client_m_hits, basic_query, small_mock_corpus, 5000, ['test'])
    assert isinstance(matches, int)
    matches = term_frequency.get_match_count(es_client_k_hits, basic_query, small_mock_corpus, 5000, ['test'])
    assert isinstance(matches, int)

def test_match_count_full(es_client, large_mock_corpus, basic_query):
    matches = term_frequency.get_match_count(es_client, basic_query, large_mock_corpus, 11000, [''])
    assert isinstance(matches, int)

def test_auc_estimate():
    sample_points = [0, 1, 2, 5, 10, 5000]
    exponential_function = lambda x: int(np.exp(-x) * 1000) + 1
    # real values: a sharp exponential decay with a long tail
    y = np.array([exponential_function(s) for s in range(5000)])
    real = sum(y)
    x_hat = np.array(sample_points)
    y_hat = np.array([exponential_function(s) for s in sample_points])
    estimate = auc(x_hat,y_hat)
    # is estimate within 10% error margin of real value?
    assert real + real*.1 >= estimate >= real - real*.1

def test_total_docs_and_tokens(es_client, mock_corpus, index_mock_corpus, mock_corpus_specs):
    """Test total document counter"""
    query = make_query(query_text='*', search_in_fields=['content'])

    fieldnames, aggregators = term_frequency.extract_data_for_term_frequency(mock_corpus, query)
    total_doc_count, token_count = term_frequency.get_total_docs_and_tokens(es_client, query, mock_corpus, aggregators)
    assert total_doc_count == mock_corpus_specs['total_docs']
    assert token_count == (mock_corpus_specs['total_words'] if mock_corpus_specs['has_token_counts'] else None)

def test_term_frequency(small_mock_corpus, index_small_mock_corpus, small_mock_corpus_specs,):

    ## search in all fields
    query = make_query(query_text='Alice')
    match_count, total_doc_count, token_count = term_frequency.get_term_frequency(query, small_mock_corpus, 100)

    assert match_count == 2
    assert total_doc_count == small_mock_corpus_specs['total_docs']
    assert token_count == None

    ## search in content (includes token count)
    query = make_query(query_text='Alice', search_in_fields=['content'])
    match_count, total_doc_count, token_count = term_frequency.get_term_frequency(query, small_mock_corpus, 100)

    assert match_count == 1
    assert total_doc_count == small_mock_corpus_specs['total_docs']
    assert token_count == small_mock_corpus_specs['total_words']

def test_histogram_term_frequency(small_mock_corpus, index_small_mock_corpus):

    cases = [
        {
            'genre': 'Children',
            'matches': 2,
            'tokens': 21
        }, {
            'genre': 'Romance',
            'matches': 2,
            'tokens': 23,
        }, {
            'genre': 'Science fiction',
            'matches': 1,
            'tokens': 23
        }
    ]

    for case in cases:
        query = make_query(query_text='of', search_in_fields=['content'])
        result = term_frequency.get_aggregate_term_frequency(query, small_mock_corpus, 'genre', case['genre'])

        assert result == {
            'key': case['genre'],
            'match_count': case['matches'],
            'total_doc_count': 1,
            'token_count': case['tokens']
        }

def test_timeline_term_frequency(small_mock_corpus, index_small_mock_corpus):

    cases = [
        {
            'min_date': '1800-01-01',
            'max_date': '1850-01-01',
            'matches': 3,
            'tokens': 46,
            'doc': 2,
        }
    ]

    for case in cases:
        query = make_query(query_text='of', search_in_fields=['content'])
        result = term_frequency.get_date_term_frequency(query, small_mock_corpus, 'date', case['min_date'], case['max_date'])

        assert result == {
            'key': case['min_date'],
            'key_as_string': case['min_date'],
            'match_count': case['matches'],
            'total_doc_count': 2,
            'token_count': case['tokens']
        }


def make_query(query_text=None, search_in_fields=None):
    query = {
        "query": {
            "bool": {
                "filter": []
            }
        }
    }

    if query_text:
        query['query']['bool']['must'] = {
            "simple_query_string": {
                "query": query_text,
                "lenient": True,
                "default_operator": "or"
            }
        }

        if search_in_fields:
            query['query']['bool']['must']['simple_query_string']['fields'] = search_in_fields


    return query

