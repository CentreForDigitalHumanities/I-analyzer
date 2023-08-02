from rest_framework import status

example_document = {
    'fieldValues': {
        'character': 'HAMLET',
        'lines': 'Whither wilt thou lead me? Speak, I\'ll go no further.',
    }
}

expected_url = f'/api/get_media?corpus=media-mock-corpus&image_path=images%2Fhamlet.png'

def test_media_views(client, mock_corpus, admin_client):
    response = admin_client.post(
        '/api/request_media',
        {'corpus': mock_corpus, 'document': example_document},
        content_type='application/json'
    )
    assert status.is_success(response.status_code)
    url = response.data['media'][0]
    assert url == expected_url

    response = client.get(url)
    assert status.is_success(response.status_code)
    assert response.as_attachment == True
    assert response.filename == 'hamlet.png'
