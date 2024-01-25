from rest_framework import status
from users.models import CustomUser
from addcorpus.tests.mock_csv_corpus import MockCSVCorpus
from addcorpus.save_corpus import load_and_save_all_corpora

def test_no_corpora(db, settings, admin_client):
    settings.CORPORA = {}
    load_and_save_all_corpora()

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

def test_corpus_serialization(admin_client, mock_corpus):
    response = admin_client.get('/api/corpus/')
    corpus = next(c for c in response.data if c['name'] == mock_corpus)
    assert corpus
    assert corpus['languages'] == ['English']
    assert corpus['category'] == 'Books'
    assert len(corpus['fields']) == 2

    secrets = ['data_directory', 'word_model_path', 'es_settings']
    for property in secrets:
        assert property not in corpus

