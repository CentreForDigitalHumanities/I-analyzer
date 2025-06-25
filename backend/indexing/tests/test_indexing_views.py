from rest_framework import status

def test_health_view(admin_user, admin_client, json_mock_corpus, index_json_mock_corpus, es_server):
    json_mock_corpus.owner = admin_user
    json_mock_corpus.save()

    response = admin_client.get(
        f'/api/indexing/health/{json_mock_corpus.id}',
        content_type='application/json'
    )

    assert status.is_success(response.status_code)
    assert response.data['index_active'] == True
