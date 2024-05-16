from rest_framework import status
from django.test.client import Client
from typing import Dict

from users.models import CustomUser
from addcorpus.models import Corpus
from addcorpus.python_corpora.save_corpus import load_and_save_all_corpora

def test_no_corpora(db, settings, admin_client):
    settings.CORPORA = {}
    load_and_save_all_corpora()

    response = admin_client.get('/api/corpus/')

    assert status.is_success(response.status_code)
    assert response.data == []

def test_corpus_documentation_view(admin_client, basic_mock_corpus, settings):
    response = admin_client.get(f'/api/corpus/documentation/{basic_mock_corpus}/')
    assert response.status_code == 200

    # should contain citation guidelines
    citation_page = next(page for page in response.data if page['type'] == 'Citation')

    # check that the page template is rendered with context
    content = citation_page['content']
    assert '{{ frontend_url }}' not in content
    assert settings.BASE_URL in content

def test_corpus_image_view(admin_client, basic_mock_corpus):
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    assert not corpus.configuration.image

    response = admin_client.get(f'/api/corpus/image/{basic_mock_corpus}')
    assert response.status_code == 200

    corpus.configuration.image = 'corpus.jpg'
    corpus.configuration.save

    response = admin_client.get(f'/api/corpus/image/{basic_mock_corpus}')
    assert response.status_code == 200

def test_nonexistent_corpus(admin_client):
    response = admin_client.get(f'/api/corpus/documentation/unknown-corpus/')
    assert response.status_code == 404

def test_no_corpus_access(db, client, basic_mock_corpus):
    '''Test a request from a user that should not have access to the corpus'''

    user = CustomUser.objects.create(username='bad-user', password='secret')
    client.force_login(user)
    response = client.get(f'/api/corpus/documentation/{basic_mock_corpus}/')
    assert response.status_code == 403


def test_corpus_documentation_unauthenticated(db, client, basic_mock_corpus):
    response = client.get(
        f'/api/corpus/documentation/{basic_mock_corpus}/')
    assert response.status_code == 401

def test_public_corpus_documentation_unauthenticated(db, client, basic_corpus_public):
    response = client.get(
        f'/api/corpus/documentation/{basic_corpus_public}/')
    assert response.status_code == 200

def test_corpus_serialization(admin_client, basic_mock_corpus):
    response = admin_client.get('/api/corpus/')
    corpus = next(c for c in response.data if c['name'] == basic_mock_corpus)
    assert corpus
    assert corpus['languages'] == ['English']
    assert corpus['category'] == 'Books'
    assert len(corpus['fields']) == 2

    secrets = ['data_directory', 'word_model_path', 'es_settings']
    for property in secrets:
        assert property not in corpus

def test_corpus_not_publication_ready(admin_client, basic_mock_corpus):
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    content_field = corpus.configuration.fields.get(name='line')
    content_field.display_type = 'text'
    content_field.save()

    response = admin_client.get('/api/corpus/')
    corpus = not any(c['name'] == basic_mock_corpus for c in response.data)

def test_corpus_edit_views(admin_client: Client, json_corpus_data: Dict, json_mock_corpus: Corpus):
    json_mock_corpus.delete()

    response = admin_client.get('/api/corpus/definitions/')
    assert status.is_success(response.status_code)
    assert len(response.data) == 0

    response = admin_client.post(
        '/api/corpus/definitions/',
        {'definition': json_corpus_data, 'active': True},
        content_type='application/json',
    )
    assert status.is_success(response.status_code)

    response = admin_client.get('/api/corpus/definitions/')
    assert status.is_success(response.status_code)
    assert len(response.data) == 1
