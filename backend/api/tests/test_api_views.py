from datetime import datetime
from addcorpus.models import Corpus
from rest_framework.status import is_success
from api.models import Query
from visualization.query import MATCH_ALL

def test_search_history_view(admin_user, admin_client):
    # get search history
    response = admin_client.get('/api/search_history/')
    assert is_success(response.status_code)
    assert len(response.data) == 0


def test_delete_search_history(auth_client, auth_user, db):
    mock_corpus = 'mock-corpus'
    corpus = Corpus.objects.create(name = mock_corpus)
    Query.objects.create(
        user=auth_user,
        corpus=corpus,
        query_json = {'es_query': MATCH_ALL},
        started=datetime.now(),
        completed=datetime.now(),
        total_results=10,
        transferred=10,
        aborted=False,
    )

    assert len(auth_user.queries.all()) == 1

    response = auth_client.post('/api/search_history/delete_all/')
    assert is_success(response.status_code)

    assert len(auth_user.queries.all()) == 0


def test_task_status_view(transactional_db, admin_client, celery_worker):
    bad_request = {
        'bad_key': 'data'
    }
    response = admin_client.post('/api/task_status', bad_request, content_type='application/json')
    assert response.status_code == 400

    nonexistent_tasks = {
        'task_ids': ['1234', '5678']
    }
    response = admin_client.post('/api/task_status', nonexistent_tasks, content_type='application/json')
    assert response.status_code == 200

def test_abort_task_view(transactional_db, admin_client, celery_worker):
    bad_request = {
        'bad_key': 'data'
    }
    response = admin_client.post('/api/abort_tasks', bad_request, content_type='application/json')
    assert response.status_code == 400

    nonexistent_tasks = {
        'task_ids': ['1234', '5678']
    }
    response = admin_client.post('/api/abort_tasks', nonexistent_tasks, content_type='application/json')
    assert response.status_code == 200

