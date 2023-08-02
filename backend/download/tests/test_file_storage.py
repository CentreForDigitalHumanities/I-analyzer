from download import tasks

def test_format_route_to_filename():
    route = '/search/mock-corpus;query=test'
    request_json = { 'route': route }
    output = tasks.create_query(request_json)
    assert output == 'mock-corpus_query=test'
