from rest_framework.test import APIClient
from rest_framework import status

def test_no_corpora(db, settings):
    settings.CORPORA = {}

    client = APIClient()
    response = client.get('/api/corpus/')

    assert status.is_success(response.status_code)
    assert response.data == []
