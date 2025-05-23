import pytest

def test_wm_documentation_view(admin_client, mock_corpus):
    response = admin_client.get(f'/api/corpus/documentation/?corpus={mock_corpus}')
    assert any(page['type'] == 'Word models'for page in response.data)

def test_related_words_view(admin_client, mock_corpus):

    query_json = {
        'query_term': 'alice',
        'corpus_name': mock_corpus,
        'neighbours': 5
    }
    response = admin_client.post(
        '/api/wordmodels/related_words',
        query_json,
        content_type='application/json'
    )
    assert response.status_code == 200


def test_word_similarity_view(admin_client, mock_corpus):
    term_1 = 'test'
    term_2 = 'testing'
    response = admin_client.get(
        f'/api/wordmodels/similarity_over_time?term_1={term_1}&term_2={term_2}&corpus_name={mock_corpus}',
        content_type='application/json'
    )
    assert response.status_code == 200

word_in_models_test_cases = [
    ('alice', True),
    ('Alice', True),
    ('aalice', False),
]


@pytest.mark.parametrize('term,in_model', word_in_models_test_cases)
def test_word_in_models_view(term, in_model, admin_client, mock_corpus):
    response = admin_client.get(
        f'/api/wordmodels/word_in_models?query_term={term}&corpus_name={mock_corpus}',
        content_type='application/json'
    )
    assert response.status_code == 200
    data = response.data

    if in_model:
        assert data['exists'] == True
        assert 'similar_keys' not in data
    else:
        assert data['exists'] == False
        assert 'similar_keys' in data


def test_neighbor_network_view(admin_client, mock_corpus):
    query_json = {
        'query_term': 'alice',
        'corpus_name': mock_corpus,
    }
    response = admin_client.post(
        '/api/wordmodels/neighbor_network',
        query_json,
        content_type='application/json'
    )
    assert response.status_code == 200
