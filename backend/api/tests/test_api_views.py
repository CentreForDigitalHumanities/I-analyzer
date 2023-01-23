from rest_framework.test import APIClient
import pytest

@pytest.mark.xfail(reason = 'user authentication not set up')
def test_search_history_view(user_credentials):
    client = APIClient()
    client.login(**user_credentials)

    # get search history
    response = client.get('/api/search_history/')
    assert response.status_code == 200
    assert len(response.data) == 0

    # add a query to search history
    data = {
        'aborted': False,
        'corpus_name': 'mock-corpus',
        'markCompleted': False,
        'markStarted': True,
        'query': "{\"queryText\":\"example\",\"filters\":[],\"sortAscending\":false}",
        'total_results': {
            'relation': 'eq',
            'value': 10
        },
        'transferred': 0,
    }
    response = client.put('api/search_history/', data, format='json')
    assert response.status_code == 200

    # get search history again
    response = client.get('/api/search_history/')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.xfail(reason='view not implemented')
def test_task_status_view():
    client = APIClient()

    bad_request = {
        'bad_key': 'data'
    }
    response = client.post('/api/task_status', bad_request, format='json')
    assert response.status_code == 400

    nonexistent_tasks = {
        'task_ids': ['1234', '5678']
    }
    response = client.post('/api/task_status', nonexistent_tasks, format='json')
    assert response.status_code == 200

@pytest.mark.xfail(reason='view not implemented')
def test_abort_task_view():
    client = APIClient()

    bad_request = {
        'bad_key': 'data'
    }
    response = client.post('/api/abort_tasks', bad_request, format='json')
    assert response.status_code == 400

    nonexistent_tasks = {
        'task_ids': ['1234', '5678']
    }
    response = client.post('/api/abort_tasks', nonexistent_tasks, format='json')
    assert response.status_code == 200

