import pytest
import json

from flask import json

FORWARD_CASES = {
    'search_unauthenticated': (
        False,
        'POST',
        '/es/times/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
        None,
        401,
    ),
    'search_bogus': (
        True,
        'POST',
        '/es/times/_search?size=20&scroll=3m',
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
    'search_unauthorized': (
        True,
        'POST',
        '/es/daily-mail/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
        None,
        401,
    ),
    'search_empty': (
        True,
        'POST',
        '/es/times/_search?size=20&scroll=3m',
        {},
        3,
        200,
    ),
    'search_success': (
        True,
        'POST',
        '/es/times/_search?size=20&scroll=3m',
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

def test_es_forwarding_views(test_app, test_es_client, times_user, client, requests, session, scenario):
    (authenticate, method, route, data,
     n_hits, status) = scenario
    if isinstance(data, dict):
        request_type = 'application/json'
        data = json.dumps(data)
    else:
        request_type = None
    if authenticate:
        client.times_login()
    response = client.open(
        route,
        method=method,
        data=data,
        content_type=request_type,
    )
    assert response.status_code == status
    if response.status_code == 200:
        hits = json.loads(response.get_data(True))['hits']['hits']
        assert len(hits) == n_hits
