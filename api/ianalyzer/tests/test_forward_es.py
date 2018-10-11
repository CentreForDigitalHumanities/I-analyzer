import pytest

from flask import json

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
}


@pytest.fixture(params=FORWARD_CASES.values(), ids=list(FORWARD_CASES.keys()))
def scenario(request):
    return request.param


def mock_es(requests, forward_response, method, es_address, status):
    rargs = {
        'method': method,
        'url': es_address,
        'status': status,
    }
    if isinstance(forward_response, dict):
        rargs['json'] = forward_response
    else:
        rargs['body'] = forward_response
    requests.add(requests.Response(**rargs))


def test_es_forwarding_views(app, requests, login, scenario):
    (authenticate, method, route, data,
     es_address, forward_response, status) = scenario
    if isinstance(data, dict):
        request_type = 'application/json'
        data = json.dumps(data)
    else:
        request_type = None
    if forward_response is not None:
        mock_es(requests, forward_response, method, es_address, status)
    with app.test_client() as client:
        headers = {}
        if authenticate:
            headers['Cookie'] = login.headers['Set-Cookie']
        response = client.open(
            route,
            method=method,
            data=data,
            content_type=request_type,
            headers=headers,
        )
        assert response.status_code == status
        if forward_response is not None:
            assert len(requests.calls) == 1
            c = requests.calls[0]
            assert response.data == c.response.content
            assert response.content_type == c.response.headers['Content-Type']
        else:
            assert len(requests.calls) == 0
