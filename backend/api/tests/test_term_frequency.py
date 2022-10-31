import api.analyze as analyze
import pytest
import csv
import api.tasks as tasks
from large_mock_corpus import MIN_YEAR as LARGE_CORPUS_MIN_YEAR, MAX_YEAR as LARGE_CORPUS_MAX_YEAR, TOTAL_DOCUMENTS as LARGE_CORPUS_DOCUMENTS

TOTAL_DOCS_IN_MOCK_CORPUS = 3
TOTAL_WORDS_IN_MOCK_CORPUS = 67

def test_extract_data_for_term_frequency(test_app):
    es_query = make_query('test', ['content', 'title'])
    search_fields, aggregators = analyze.extract_data_for_term_frequency('mock-corpus', es_query)

    # fieldnames should look at specified fields
    target_fields = ['content', 'title']
    assert set(target_fields) == set(search_fields)

    # no .length multifield for all fields, so no aggregator
    assert aggregators == None

    # restrict the search field to one with token counts
    fields_with_token_counts = ['content']
    es_query = make_query('test', fields_with_token_counts)
    fieldnames, aggregators = analyze.extract_data_for_term_frequency('mock-corpus', es_query)

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

def test_match_count(test_app, test_es_client):
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
        fieldnames, aggregators = analyze.extract_data_for_term_frequency('mock-corpus', query)
        match_count = analyze.get_match_count(test_es_client, query, 'mock-corpus', 100, fieldnames)
        assert match_count == freq

def test_total_docs_and_tokens(test_app, test_es_client):
    """Test total document counter"""

    query = make_query(query_text='*', search_in_fields=['content'])
    fieldnames, aggregators = analyze.extract_data_for_term_frequency('mock-corpus', query)
    total_doc_count, token_count = analyze.get_total_docs_and_tokens(test_es_client, query, 'mock-corpus', aggregators)
    assert total_doc_count == TOTAL_DOCS_IN_MOCK_CORPUS
    assert token_count == TOTAL_WORDS_IN_MOCK_CORPUS

def test_term_frequency(test_app, test_es_client):

    ## search in all fields
    query = make_query(query_text='Alice')
    match_count, total_doc_count, token_count = analyze.get_term_frequency(query, 'mock-corpus', 100)

    assert match_count == 2
    assert total_doc_count == TOTAL_DOCS_IN_MOCK_CORPUS
    assert token_count == None

    ## search in content (includes token count)
    query = make_query(query_text='Alice', search_in_fields=['content'])
    match_count, total_doc_count, token_count = analyze.get_term_frequency(query, 'mock-corpus', 100)

    assert match_count == 1
    assert total_doc_count == TOTAL_DOCS_IN_MOCK_CORPUS
    assert token_count == TOTAL_WORDS_IN_MOCK_CORPUS

def test_histogram_term_frequency(test_app, test_es_client):

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
        result = analyze.get_aggregate_term_frequency(query, 'mock-corpus', 'genre', case['genre'])

        assert result == {
            'key': case['genre'],
            'match_count': case['matches'],
            'total_doc_count': 1,
            'token_count': case['tokens']
        }

def test_timeline_term_frequency(test_app, test_es_client):

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
        result = analyze.get_date_term_frequency(query, 'mock-corpus', 'date', case['min_date'], case['max_date'])

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

full_data_parameters = [{
    'es_query': make_query(query_text = 'the', search_in_fields=['content']),
    'corpus_name': 'large-mock-corpus',
    'field_name': 'date',
    'bins': [
        {
            'start_date': '{}-01-01'.format(year),
            'end_date': '{}-12-31'.format(year),
            'size': 10,
        }
        for year in range(LARGE_CORPUS_MIN_YEAR, LARGE_CORPUS_MAX_YEAR + 1)
    ],
    'unit': 'year'
}]

def test_timeline_full_data(large_mock_corpus):
    filename = tasks.timeline_term_frequency_full_data(full_data_parameters)

    with open(filename) as f:
        reader = csv.DictReader(f)
        rows = list(row for row in reader)

        total_expectations = {
            'Total documents': LARGE_CORPUS_DOCUMENTS,
            'Term frequency': LARGE_CORPUS_DOCUMENTS * 2, # 2 hits per document
            'Relative term frequency (by # documents)': 2 * len(full_data_parameters[0]['bins'])
        }

        for column, expected_total in total_expectations.items():
            total = sum(float(row[column]) for row in rows)
            assert total == expected_total

