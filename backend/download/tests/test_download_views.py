from rest_framework import status
import pytest
import os
import csv
from download import create_csv
from download.models import Download
from addcorpus.models import Corpus
import io

def test_direct_download_view(admin_client, mock_corpus, index_mock_corpus, csv_directory, mock_corpora_in_db):
    request_json = {
        "corpus": mock_corpus,
        "es_query": {"query":{"bool":{"must":{"match_all":{}},"filter":[]}}},
        "fields": ['date','content'],
        "size": 3,
        "route": f"/search/{mock_corpus}",
        "encoding":"utf-8"
    }
    response = admin_client.post(
        '/api/download/search_results',
        request_json,
        content_type='application/json'
    )
    assert status.is_success(response.status_code)

def test_schedule_download_view(transactional_db, admin_client, mock_corpus, select_small_mock_corpus,
                                index_mock_corpus, celery_worker, csv_directory, mock_corpora_in_db):
    request_json = {
        "corpus": mock_corpus,
        "es_query": {"query":{"bool":{"must":{"match_all":{}},"filter":[]}}},
        "fields": ['date','content'],
        "route": f"/search/{mock_corpus}",
        "encoding":"utf-8"
    }
    response = admin_client.post(
        '/api/download/search_results_task',
        request_json,
        content_type='application/json'
    )
    assert status.is_success(response.status_code)

@pytest.fixture()
def term_frequency_parameters(mock_corpus, mock_corpus_specs):
    min_year = mock_corpus_specs['min_date'].year
    max_year = mock_corpus_specs['max_date'].year
    # TODO: construct query from query module, which is much more convenient
    query_text = mock_corpus_specs['example_query']
    search_field = mock_corpus_specs['content_field']
    query = {
        "query": {
            "bool": {
                "must": {
                    "simple_query_string": {
                        "query": query_text,
                        "fields": [search_field],
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

def test_full_data_download_view(transactional_db, admin_client, mock_corpus, term_frequency_parameters,
                                 select_small_mock_corpus, index_mock_corpus, celery_worker,
                                 csv_directory, mock_corpora_in_db):
    request_json = {
        'visualization': 'date_term_frequency',
        'parameters': [term_frequency_parameters],
        'corpus': mock_corpus
    }
    response = admin_client.post(
        '/api/download/full_data',
        request_json,
        content_type='application/json'
    )
    assert status.is_success(response.status_code)

def test_empty_download_history_view(admin_client):
    response = admin_client.get(
        '/api/download/'
    )

    assert status.is_success(response.status_code)
    assert response.data == []

@pytest.fixture()
def finished_download(admin_user, csv_directory, mock_corpus, select_small_mock_corpus, mock_corpora_in_db):
    filepath = os.path.join(csv_directory, mock_corpus + '.csv')
    corpus = Corpus.objects.get(name=mock_corpus)
    download = Download.objects.create(download_type='search_results', corpus=corpus, parameters={}, user=admin_user)

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
    return download.id

def test_download_history_view(admin_client, finished_download, mock_corpus):
    response = admin_client.get(
        '/api/download/'
    )

    assert status.is_success(response.status_code)
    assert len(response.data) == 1
    download = next(d for d in response.data)
    assert download['corpus'] == mock_corpus
    assert download['status'] == 'done'

def test_csv_download_view(admin_client, finished_download):
    encoding = 'utf-8'
    format = 'long'
    response = admin_client.get(
        f'/api/download/csv/{finished_download}?encoding={encoding}&table_format={format}'
    )
    assert status.is_success(response.status_code)

    # read file content of response
    content_bytes = io.BytesIO(response.getvalue()).read()
    content_string = bytes.decode(content_bytes, encoding)
    reader = csv.DictReader(io.StringIO(content_string), delimiter=';')
    assert reader.fieldnames == ['content', 'date', 'genre', 'query', 'title']
    rows = [row for row in reader]
    assert len(rows) == 1
