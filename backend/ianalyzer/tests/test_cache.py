import api.cache as cache
from ianalyzer.conftest import db, session
import pytest

visualization_type = 'test'
corpus = 'test-corpus'
result = {
    'data': [1,2,3,4]
}

def test_cache(session):
    parameters = {
        'blabla': 'blablabla',
        'blablabla': 'bla'
    }

    cached = cache.check_visualization_cache(visualization_type, corpus, parameters)
    assert cached == None

    cached_id = cache.store_new_visualization(visualization_type, corpus, parameters)
    found = cache.check_visualization_cache(visualization_type, corpus, parameters)
    assert found.id == cached_id
    assert found.id != None

    cached_result = cache.get_visualization_result(cached_id)
    assert cached_result == None

    cache.store_visualization_result(cached_id, result)

    cached_result = cache.get_visualization_result(cached_id)
    assert cached_result == result

def test_make_visualisation(session):
    parameters = {
        'blabla': 'bla',
        'blablabla': 'blabla'
    }

    def visualise(): return result

    cached_result = cache.make_visualization(visualization_type, corpus, parameters, visualise)
    assert cached_result == result

    # try running the function again
    # provide the 'wrong' visualisation function to ensure that the result is retrieved from cache
    def wrongfunction(): return { }
    cached_result = cache.make_visualization(visualization_type, corpus, parameters, wrongfunction)
    assert cached_result == result
