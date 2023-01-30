from rest_framework import status
import pytest
import os
import csv
from download import create_csv
from download.models import Download
import io

@pytest.mark.xfail(reason='view not implemented')
def test_direct_download_view(authenticated_client, mock_corpus):
    request_json = {
        "corpus": mock_corpus,
        "es_query": {"query":{"bool":{"must":{"match_all":{}},"filter":[]}}},
        "fields": ['date','content'],
        "size": 217,
        "route": f"/search/{mock_corpus}",
        "encoding":"utf-8"
    }
    response = authenticated_client.post(
        '/api/download/search_results',
        request_json,
        content_type='application/json'
    )
    assert status.is_success(response.status_code)

@pytest.mark.xfail(reason='view not implemented')
def test_schedule_download_view(authenticated_client, mock_corpus):
    request_json = {
        "corpus": mock_corpus,
        "es_query": {"query":{"bool":{"must":{"match_all":{}},"filter":[]}}},
        "fields": ['date','content'],
        "route": f"/search/{mock_corpus}",
        "encoding":"utf-8"
    }
    response = authenticated_client.post(
        '/api/download/search_results_task',
        request_json,
        content_type='application/json'
    )
    assert status.is_success(response.status_code)

@pytest.fixture()
def term_frequency_parameters(mock_corpus):
    # TODO: get min_year and max_year from mock corpus metadata
    min_year = 1800
    max_year = 1899
    # TODO: construct query from query module, which is much more convenient
    query = {
        "query": {
            "bool": {
                "must": {
                    "simple_query_string": {
                        "query": "parliament",
                        "fields": ["speech"],
                        "lenient": True,
                        "default_operator": "or"
                    }
                },
                "filter": []
            }
        }
    }
    return {
        'es_query':  query,
        'corpus_name': mock_corpus,
        'field_name': 'date',
        'bins': [
            {
                'start_date': '{}-01-01'.format(year),
                'end_date': '{}-12-31'.format(year),
                'size': 10,
            }
            for year in range(min_year, max_year + 2)
        ],
        'unit': 'year',
    }

@pytest.mark.xfail(reason='view not implemented')
def test_full_data_download_view(authenticated_client, mock_corpus, term_frequency_parameters):
    request_json = {
        'visualization': 'date_term_frequency',
        'parameters': [term_frequency_parameters],
        'corpus': mock_corpus
    }
    response = authenticated_client.post(
        '/api/download/full_data',
        request_json,
        content_type='application/json'
    )
    assert status.is_success(response.status_code)

def test_empty_download_history_view(authenticated_client):
    response = authenticated_client.get(
        '/api/download/'
    )

    assert status.is_success(response.status_code)
    assert response.data == []

@pytest.fixture()
def finished_download(corpus_user, csv_directory, mock_corpus, select_small_mock_corpus):
    filepath = os.path.join(csv_directory, mock_corpus + '.csv')
    download = Download.objects.create(download_type='search_results', corpus=mock_corpus, parameters={}, user=corpus_user)

    with open(filepath, 'w') as outfile:
        writer = csv.DictWriter(outfile,
            fieldnames=['content', 'date', 'genre', 'query', 'title'],
            **create_csv.SEARCH_RESULTS_DIALECT)
        writer.writeheader()
        writer.writerow({
            'content': "You will rejoice to hear...",
            'date': '1818-01-01',
            'genre': 'Science fiction',
            'query': mock_corpus,
            'title': 'Frankenstein, or, the Modern Prometheus'
        })

    _, filename = os.path.split(filepath)
    download.complete(filename)
    return id

def test_download_history_view(authenticated_client, finished_download, mock_corpus):
    response = authenticated_client.get(
        '/api/download/'
    )

    assert status.is_success(response.status_code)
    assert len(response.data) == 1
    download = next(d for d in response.data)
    assert download['corpus'] == mock_corpus
    assert download['status'] == 'done'

@pytest.mark.xfail(reason='view not implemented')
def test_csv_download_view(authenticated_client, finished_download):
    response = authenticated_client.get(
        f'/api/download/csv/{finished_download}'
    )
    assert status.is_success(response.status_code)
