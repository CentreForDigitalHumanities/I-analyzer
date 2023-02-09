from rest_framework.status import is_success


def test_add(celery_worker, auth_client):
    response = auth_client.get('/api/visualization/add')
    assert is_success(response.status_code)
    assert response.data == {'result': 3}
