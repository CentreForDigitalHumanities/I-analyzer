import pytest

from flask import json
#from ianalyzer.tests.conftest import db, client, requests, session, test_app, times_user

FORWARD_CASES = {
    'head_bogus': (                  # for each of these tuples:
        True,                          # whether to authenticate first
        'HEAD',                        # request method
        '/es/bogus',                   # route on our application
        None,                          # request content, if any
        'http://localhost:9200',       # ES URL (not) to be proxied
        None,                          # forwarded response content if proxied
        404,                           # expected http status from our view
    ),
    'head_unauthenticated': (
        False,
        'HEAD',
        '/es/default',
        None,
        'http://localhost:9200',
        None,
        401,
    ),
    'head_success': (
        True,
        'HEAD',
        '/es/default',
        None,
        'http://localhost:9200',
        '',
        200,
    ),
    'scroll_unauthenticated': (
        False,
        'POST',
        '/es/default/_search/scroll?scroll=3m',
        {'scroll_id': 'bladiebla'},
        'http://localhost:9200/_search/scroll?scroll=3m',
        None,
        401,
    ),
    'scroll_bogus': (
        True,
        'POST',
        '/es/bogus/_search/scroll?scroll=3m',
        {'scroll_id': 'bladiebla'},
        'http://localhost:9200/_search/scroll?scroll=3m',
        None,
        404,
    ),
    'scroll_empty': (
        True,
        'POST',
        '/es/default/_search/scroll?scroll=3m',
        {},
        'http://localhost:9200/_search/scroll?scroll=3m',
        {'error': 'No scroll ID provided'},
        400,
    ),
    'scroll_success': (
        True,
        'POST',
        '/es/default/_search/scroll?scroll=3m',
        {'scroll_id': 'bladiebla'},
        'http://localhost:9200/_search/scroll?scroll=3m',
        {'hits': {}},
        200,
    ),
    'search_unauthenticated': (
        False,
        'POST',
        '/es/default/times/article/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
        'http://localhost:9200/times/article/_search?size=20&scroll=3m',
        None,
        401,
    ),
    'search_bogus': (
        True,
        'POST',
        '/es/bogus/times/article/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
        'http://localhost:9200/times/article/_search?size=20&scroll=3m',
        None,
        404,
    ),
    'search_unauthorized': (
        True,
        'POST',
        '/es/default/daily-mail/article/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
        'http://localhost:9200/times/article/_search?size=20&scroll=3m',
        None,
        404,
    ),
    'search_empty': (
        True,
        'POST',
        '/es/default/times/article/_search?size=20&scroll=3m',
        {},
        'http://localhost:9200/times/article/_search?size=20&scroll=3m',
        {'error': 'no query'},
        400,
    ),
    'search_success': (
        True,
        'POST',
        '/es/default/times/article/_search?size=20&scroll=3m',
        {'query': {'bool': {
            'must': {'simple_query_string': {
                'query': 'banana',
                'lenient': True,
                'default_operator': 'or',
            }},
            'filter': [],
        }}},
        'http://localhost:9200/times/article/_search?size=20&scroll=3m',
        {'hits': {}},
        200,
    ),
}


@pytest.fixture(params=FORWARD_CASES.values(), ids=list(FORWARD_CASES.keys()))
def scenario(request):
    return request.param


def mock_es(requests, forward_response, method, es_address, status):
    rargs = {
        'method': method,
        'url': es_address,
        'status': status,
        'stream': True,
    }
    if isinstance(forward_response, dict):
        rargs['json'] = forward_response
    else:
        rargs['body'] = forward_response
    requests.add(requests.Response(**rargs))


def test_es_forwarding_views(test_app, times_user, client, requests, session, scenario):
    (authenticate, method, route, data,
     es_address, forward_response, status) = scenario
    if isinstance(data, dict):
        request_type = 'application/json'
        data = json.dumps(data)
    else:
        request_type = None
    if forward_response is not None:
        mock_es(requests, forward_response, method, es_address, status)
        if isinstance(forward_response, dict):
            forward_response = json.dumps(forward_response)
    if authenticate:
        client.times_login()
    response = client.open(
        route,
        method=method,
        data=data,
        content_type=request_type,
    )
    assert response.status_code == status
    if forward_response is not None:
        assert len(requests.calls) == 1
        c = requests.calls[0]
        assert response.get_data(True) == forward_response
        assert response.content_type == c.response.headers['Content-Type']
    else:
        assert len(requests.calls) == 0
