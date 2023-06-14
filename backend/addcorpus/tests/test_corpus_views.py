from rest_framework import status
from users.models import CustomUser


def test_no_corpora(db, settings, admin_client):
    settings.CORPORA = {}

    response = admin_client.get('/api/corpus/')

    assert status.is_success(response.status_code)
    assert response.data == []

def test_corpus_documentation_view(admin_client, mock_corpus):
    response = admin_client.get(f'/api/corpus/documentation/{mock_corpus}/mock-csv-corpus.md')
    assert response.status_code == 200

def test_nonexistent_corpus(admin_client):
    response = admin_client.get(f'/api/corpus/documentation/unknown-corpus/mock-csv-corpus.md')
    assert response.status_code == 404

def test_no_corpus_access(db, client, mock_corpus):
    '''Test a request from a user that should not have access to the corpus'''

    user = CustomUser.objects.create(username='bad-user', password='secret')
    client.force_login(user)
    response = client.get(f'/api/corpus/documentation/{mock_corpus}/mock-csv-corpus.md')
    assert response.status_code == 403
