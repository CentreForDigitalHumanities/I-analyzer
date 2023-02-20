from rest_framework.test import APIClient
import pytest
from datetime import datetime
from addcorpus.models import Corpus
from rest_framework.status import is_success

def test_search_history_view(admin_client):
    corpus = Corpus.objects.create(name = 'mock-corpus', description = '')

    # get search history
    response = admin_client.get('/api/search_history/')
    assert is_success(response.status_code)
    assert len(response.data) == 0

    # add a query to search history
    data = {
        'aborted': False,
        'corpus': 'mock-corpus',
        'user': 1,
        'started': datetime.now().isoformat(),
        'completed': datetime.now().isoformat(),
        'query_json': {
            "queryText": "example",
            "filters": [],
            "sortAscending": False
        },
        'total_results': 10,
        'transferred': 0,
    }
    response = admin_client.post('/api/search_history/', data, content_type='application/json')
    assert is_success(response.status_code)

    # get search history again
    response = admin_client.get('/api/search_history/')
    assert  is_success(response.status_code)
    assert len(response.data) == 1


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

