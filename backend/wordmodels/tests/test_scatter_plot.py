import re
import numpy as np
from wordmodels.decompose import coordinates_from_parameters, parameters_from_coordinates, total_alignment_loss, alignment_loss_adjacent_timeframes, initial_coordinates, rotate_coordinates_in_timeframe
from wordmodels.visualisations import get_2d_contexts_over_time
import pytest
from wordmodels.conftest import WM_MOCK_CORPORA
import pytest

NUMBER_SIMILAR = 5

def test_coordinates_parameters_conversion():
    coordinates = [
        np.array([
            [1.0, 0.0],
            [0.25, 0.75],
            [0.5, 0.5],
        ]),
        np.array([
            [0.0, 0.0],
            [0.2, 0.3],
        ]),
    ]
    terms = [['a', 'b', 'c'], ['a', 'b']]
    parameters = [0.0, 0.0]

    assert parameters_from_coordinates(parameters) == parameters

    for timeframe, converted in enumerate(coordinates_from_parameters(parameters, coordinates)):
        original = coordinates[timeframe]

        assert converted.shape == original.shape
        assert np.all(np.equal(converted, original))

def find_term(term, interval_result):
    data = interval_result['data']
    return next((item for item in data if item['label'] == term), None)

def test_2d_context_over_time_result(test_app):
    """Test if the context result makes sense."""
    all_data = get_2d_contexts_over_time('she', 'mock-svd-ppmi-corpus')

    for interval in all_data:
        assert find_term('she', interval)
        assert find_term('her', interval)

    assert find_term('elizabeth', all_data[0])
    assert find_term('alice', all_data[1])

def test_term_not_in_all_intervals(test_app):
    all_data = get_2d_contexts_over_time('alice', 'mock-svd-ppmi-corpus', NUMBER_SIMILAR)

    # check that each interval returns coordinates for the keyword
    for interval in all_data:
        assert find_term('alice', interval)

    # check that interval 1 includes neighbouring words, but 0 and 2 do not
    keyword_in_model = [all_data[1]]
    keyword_not_in_model = [all_data[0], all_data[2]]

    for interval in keyword_in_model:
        assert len(interval['data']) == NUMBER_SIMILAR + 1

    for interval in keyword_not_in_model:
        assert len(interval['data']) == 1

@pytest.mark.parametrize('mock_corpus', WM_MOCK_CORPORA)
def test_2d_contexts_over_time_format(test_app, mock_corpus):
    terms_per_corpus = {
        'mock-svd-ppmi-corpus': 'she',
        'mock-wordvec-corpus': 'payement'
    }
    term = terms_per_corpus[mock_corpus]

    data = get_2d_contexts_over_time(term, mock_corpus)
    assert data and len(data)

    for item in data:
        assert 'time' in item
        assert re.match(r'\d{4}-\d{4}', item['time'])

        assert 'data' in item

        for point_data in item['data']:
            assert set(point_data.keys()) == {'label', 'x', 'y'}
            assert type(point_data['x']) == type(point_data['y']) == float

def test_initial_map():
    vectors_per_timeframe = [
        np.random.rand(3, 4),
        np.random.rand(1, 4),
        np.random.rand(3, 4),
    ]

    terms_per_timeframe = [
        ['a', 'b', 'c'],
        ['a'],
        ['a', 'b', 'd']
    ]

    coordinates_per_timeframe = initial_coordinates(vectors_per_timeframe, terms_per_timeframe)

    assert len(coordinates_per_timeframe) == len(terms_per_timeframe)

    for coordinates, terms in zip(coordinates_per_timeframe, terms_per_timeframe):
        assert coordinates.shape == (len(terms), 2)

def test_alignment_loss_adjacent_timeframes():

    coordinates_1 = np.array([
        [1.0, 0.0],
        [0.0, 1.0]
    ])

    coordinates_2 = np.array([
        [0.0, 1.0],
        [1.0, 0.0],
    ])

    terms_1 = ['a', 'b']
    terms_2 = ['b', 'a']

    assert alignment_loss_adjacent_timeframes(coordinates_1, terms_1, coordinates_2, terms_2) == 0.0
    assert alignment_loss_adjacent_timeframes(coordinates_1, terms_1, coordinates_2, terms_1) == 1.0

    terms_2_alt = ['c', 'a']
    assert alignment_loss_adjacent_timeframes(coordinates_1, terms_1, coordinates_2, terms_2_alt) == 0.0

    coordinates_2_alt = np.array([
        [0.0, 1.0],
        [1.0, 0.5],
    ])
    assert alignment_loss_adjacent_timeframes(coordinates_1, terms_1, coordinates_2_alt, terms_2) == 0.0625

def test_alignment_loss():
    coordinates = [
        np.array([
            [1.0, 0.0],
            [0.0, 1.0]
        ]),
        np.array([
            [0.0, 1.0],
            [1.0, 0.0],
        ]),
        np.array([
            [0.0, 1.0],
            [1.0, 0.5],
        ])
    ]

    terms = [
        ['a', 'b'],
        ['b', 'a'],
        ['b', 'a']
    ]

    assert total_alignment_loss(coordinates, terms) == 0.0625
    assert total_alignment_loss(coordinates[:2], terms[:2]) == 0.0

@pytest.fixture(params=[0, 90])
def rotation_test_case(request):
    original_coordinates = np.array([
        [1.0, 0.0],
        [0.0, 1.0],
        [1.0, 0.5],
    ])

    expected_results = {
        0: original_coordinates,
        90: np.array([
            [0.0, -1.0],
            [1.0, 0.0],
            [0.5, -1.0],
        ])
    }
    angle = request.param
    expected_result = expected_results[angle]

    return original_coordinates, angle, expected_result

def test_rotation(rotation_test_case):
    original_coordinates, angle, expected_result = rotation_test_case
    result = rotate_coordinates_in_timeframe(original_coordinates, angle)
    rounded_result = np.round(result, 2)
    assert np.all(np.equal(rounded_result, expected_result))
