from visualization.query import MATCH_ALL
import pytest
from rest_framework import status

@pytest.fixture()
def wordcloud_body(mock_corpus):
    return {
        'corpus': mock_corpus,
        'field': 'content',
        'es_query': MATCH_ALL,
        'size': 1000,
    }

def test_wordcloud_view(authenticated_client, mock_corpus, index_mock_corpus, wordcloud_body):
    response = authenticated_client.post(
        '/api/visualization/wordcloud',
        wordcloud_body,
        content_type='application/json'
    )
    assert status.is_success(response.status_code)

@pytest.fixture
def date_term_frequency_body(basic_query):
    return {
        'es_query': basic_query,
        'corpus_name': 'mock-corpus',
        'field_name': 'date',
        'bins': [
            {
                'start_date': '1850-01-01',
                'end_date': '1850-12-31',
                'size': 10,
            }, {
                'start_date': '1851-01-01',
                'end_date': '1851-12-31',
                'size': 10,

            }
        ]

    }

@pytest.fixture
def aggregate_term_frequency_body(basic_query):
    return {
        'es_query': basic_query,
        'corpus_name': 'mock-corpus',
        'field_name': 'genre',
        'bins': [
            { 'field_value': 'Romance', 'size': 10 },
            { 'field_value': 'Science fiction', 'size': 10 },
            { 'field_value': 'Children', 'size': 10 },
        ]
    }

@pytest.fixture
def ngram_body(basic_query):
    return {
        'es_query': basic_query,
        'corpus_name': 'mock-corpus',
        'field_name': 'content',
        'ngram_size': 2,
        'term_position': [0, 1],
        'freq_compensation': True,
        'subfield': 'clean',
        'max_size_per_interval': 2
    }

# TODO: these tests need extra fixtures to access corpus definitions, elasticsearch, and a celery worker

@pytest.mark.xfail(reason = 'view not implemented')
def test_ngrams(authenticated_client, ngram_body):
    post_response = authenticated_client.post('/api/ngram_tasks', json=ngram_body, format='json')
    assert post_response.status_code == 200

@pytest.mark.xfail(reason = 'view not implemented')
def test_aggregate_term_frequency(authenticated_client, aggregate_term_frequency_body):
    post_response = authenticated_client.post('/api/aggregate_term_frequency', aggregate_term_frequency_body, format='json')
    assert post_response.status_code == 200
    del aggregate_term_frequency_body['es_query']
    post_response = authenticated_client.post('/api/aggregate_term_frequency', aggregate_term_frequency_body, format='json')
    assert post_response.status_code == 400

@pytest.mark.xfail(reason = 'view not implemented')
def test_date_term_frequency(authenticated_client, date_term_frequency_body):
    post_response = authenticated_client.post('/api/date_term_frequency', date_term_frequency_body, format='json')
    assert post_response.status_code == 200
    del date_term_frequency_body['corpus_name']
    post_response = authenticated_client.post('/api/date_term_frequency', date_term_frequency_body, format='json')
    assert post_response.status_code == 400
