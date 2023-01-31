import pytest
import json
from rest_framework.test import APIClient

from es.search import hits

FORWARD_CASES = {
    'search_unauthenticated': (
        False,
        '/api/es/times/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
        None,
        403,
    ),
    'search_bogus': (
        True,
        '/api/es/times/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'pineapple',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
        0,
        200,
    ),
    'search_nonexistent': (
        True,
        '/api/es/daily-mail/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
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
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
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
