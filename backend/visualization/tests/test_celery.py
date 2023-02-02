from rest_framework.status import is_success
import pytest

@pytest.mark.celery(result_backend='redis://')
def test_add(celery_worker, client):
    response = client.get('/api/visualization/add')
    assert is_success(response.status_code)
    assert response.data == {'result': 3}
