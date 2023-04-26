from rest_framework import status
from users.models import CustomUser
from addcorpus.tests.mock_csv_corpus import MockCSVCorpus

def test_no_corpora(db, settings, auth_client):
    settings.CORPORA = {}

    response = auth_client.get('/api/corpus/')

    assert status.is_success(response.status_code)
    assert response.data == []

def test_corpus_documentation_view(client, mock_corpus, mock_corpus_user):
    client.force_login(mock_corpus_user)
    response = client.get(f'/api/corpus/documentation/{mock_corpus}/mock-csv-corpus.md')
    assert response.status_code == 200

def test_nonexistent_corpus(client, mock_corpus, mock_corpus_user):
    client.force_login(mock_corpus_user)
    response = client.get(f'/api/corpus/documentation/unknown-corpus/mock-csv-corpus.md')
    assert response.status_code == 404

def test_no_corpus_access(client, mock_corpus, mock_corpus_user):
    '''Test a request from a user that should not have access to the corpus'''

    # mock_corpus_user makes sure the corpus is properly saved in the database.
    # now make a new user that does not have access

    user = CustomUser.objects.create(username='bad-user', password='secret')
    client.force_login(user)
    response = client.get(f'/api/corpus/documentation/{mock_corpus}/mock-csv-corpus.md')
    assert response.status_code == 403

def test_corpus_serialization(client, mock_corpus, mock_corpus_user):
    client.force_login(mock_corpus_user)
    response = client.get('/api/corpus/')
    corpus = response.data[0]
    assert corpus['title'] == MockCSVCorpus.title
    assert corpus['languages'] == ['English']
    assert corpus['category'] == 'Books'
    assert len(corpus['fields']) == 2
