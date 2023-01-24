import pytest

@pytest.mark.xfail(reason='view not implemented')
def test_related_words_view(authenticated_client, mock_corpus):

    query_json = {
        'query_term': 'test',
        'corpus_name': mock_corpus,
        'neighbours': 5
    }
    response = authenticated_client.post(
        '/api/wordmodels/related_words',
        query_json,
        content_type='application/json'
    )
    assert response.status_code == 200

@pytest.mark.xfail(reason='view not implemented')
def test_word_similarity_view(authenticated_client, mock_corpus):
    term_1 = 'test'
    term_2 = 'testing'
    response = authenticated_client.get(
        f'/api/wordmodels/similarity_over_time?term_1={term_1}&term_2={term_2}&corpus_name={mock_corpus}',
        content_type='application/json'
    )
    assert response.status_code == 200

@pytest.mark.xfail(reason='view not implemented')
def test_wm_documentation_view(authenticated_client, mock_corpus):

    response = authenticated_client.get(
        '/api/wordmodels/documentation',
        content_type='application/json'
    )
    assert response.status_code == 200


@pytest.mark.xfail(reason='view not implemented')
def test_word_in_model_view(authenticated_client, mock_corpus):
    term = 'test'
    response = authenticated_client.get(
        f'/api/wordmodels/word_in_model?query_term={term}&corpus_name={mock_corpus}',
        content_type='application/json'
    )
    assert response.status_code == 200
