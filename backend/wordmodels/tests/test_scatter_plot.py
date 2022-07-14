import re
import numpy as np
from wordmodels.visualisations import load_word_models, get_2d_context, get_2d_contexts_over_time

NUMBER_SIMILAR = 5

def get_context_in_timeframe(test_app, term):
    filename = test_app.config['WM_BINNED_FN']
    models = load_word_models('mock-corpus', filename)
    model = models[0]
    data = get_2d_context(term, model, NUMBER_SIMILAR)
    return data

def test_2d_context_format(test_app):
    data = get_context_in_timeframe(test_app, 'elizabeth')
    assert data
    assert len(data) == NUMBER_SIMILAR + 1 # expected number of similar terms + the term itself

    for item in data:
        assert set(item.keys()) == {'label', 'x', 'y'}
        assert type(item['label']) == str
        x = round(item['x'], 5)
        y = round(item['y'], 5)
        assert x >= -1 and x <= 1
        assert y >= -1 and y <= 1

def test_2d_context(test_app):
    data = get_context_in_timeframe(test_app, 'elizabeth')
    expected_term = next((item for item in data if item['label'] == 'she'), None)
    assert expected_term

def test_2d_contexts_over_time_format(test_app):
    term = 'she'

    data = get_2d_contexts_over_time(term, 'mock-corpus')
    assert data and len(data)

    for item in data:
        assert 'time' in item
        assert re.match(r'\d{4}-\d{4}', item['time'])

        assert 'data' in item

        for point_data in item['data']:
            assert set(point_data.keys()) == {'label', 'x', 'y'}
