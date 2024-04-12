import pytest

from api.models import Query
from es.search import hits
from visualization.query import MATCH_ALL

FORWARD_CASES = {
    'search_restricted_corpus': (
        False,
        '/api/es/times/_search?size=20&scroll=3m',
        { 'es_query': {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}}},
        None,
        401,
    ),
    'search_bogus': (
        True,
        '/api/es/times/_search?size=20&scroll=3m',
        { 'es_query': {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'pineapple',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}}},
        0,
        200,
    ),
    'search_nonexistent': (
        True,
        '/api/es/daily-mail/_search?size=20&scroll=3m',
        { 'es_query': {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}}},
        None,
        404,
    ),
    'search_empty': (
        True,
        '/api/es/times/_search?size=20&scroll=3m',
        {},
        3,
        200,
    ),
    'search_success': (
        True,
        '/api/es/times/_search?size=20&scroll=3m',
        {'es_query': {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}}},
        1,
        200,
    ),
}

@pytest.fixture(params=FORWARD_CASES.values(), ids=list(FORWARD_CASES.keys()))
def scenario(request):
    return request.param

def test_es_forwarding_views(scenario, es_forward_client, client, times_user):
    (authenticate, route, data,
     n_hits, status) = scenario

    if authenticate:
        client.force_login(times_user)

    response = client.post(route, data, content_type = 'application/json')
    assert response.status_code == status

    if response.status_code == 200:
        assert len(hits(response.data)) == n_hits

def test_search_history_is_saved(mock_corpus, times_user, es_forward_client, client):
    assert times_user.queries.count() == 0

    client.force_login(times_user)

    search = lambda: client.post(
        '/api/es/times/_search',
        {'es_query': MATCH_ALL},
        content_type='application/json',
    )

    response = search()

    assert response.status_code == 200
    assert times_user.queries.count() == 1

    response2 = search()

    assert response2.status_code == 200
    assert times_user.queries.count() == 1


def test_unauthenticated_search(client, basic_mock_corpus, basic_corpus_public, index_basic_mock_corpus):
    queries_before_search = Query.objects.count()
    response = client.post(
        f'/api/es/{basic_mock_corpus}/_search',
        {'es_query': MATCH_ALL},
        content_type='application/json',
    )
    assert response.status_code == 200
    assert Query.objects.count() == queries_before_search
