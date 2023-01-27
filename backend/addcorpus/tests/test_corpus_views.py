from rest_framework.test import APIClient
from rest_framework import status

def test_no_corpora(db, settings):
    settings.CORPORA = {}

    client = APIClient()
    response = client.get('/api/corpus/')

    assert status.is_success(response.status_code)
    assert response.data == []

def test_corpus_documentation_view(client, mock_corpus, mock_corpus_user):
    client.force_login(mock_corpus_user)
    response = client.get(f'/api/corpus/documentation/{mock_corpus}/mock-csv-corpus.md')
    assert response.status_code == 200
