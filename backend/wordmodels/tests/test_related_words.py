import pytest
import numpy as np

from wordmodels.visualisations import get_diachronic_contexts, get_context_time_interval
from wordmodels.conftest import TEST_BINS, WM_MOCK_CORPORA

def assert_similarity_format(item, must_specify_time = True):
    assert 'key' in item and type(item['key']) == str

    assert 'similarity' in item
    assert type(item['similarity']) in [float, np.float64, type(None)]

    if must_specify_time:
        assert 'time' in item and type(item['time']) == str


@pytest.mark.parametrize("mock_corpus", WM_MOCK_CORPORA)
def test_context_time_interval(test_app, mock_corpus):
    cases = {
        'mock-svd-ppmi-corpus': {
            'term': 'alice',
            'bin_without_match':'1810-1839',
            'bin': '1840-1869',
            'similar1': 'she',
            'similar2': 'her'
        },
        'mock-wordvec-corpus': {
            'term': 'président',
            'bin': '1900-1920',
            'similar1': 'droit',
            'similar2': 'peut'
        }
    }
    case = cases.get(mock_corpus)
    term = case.get('term')

    bin_without_match = case.get('bin_without_match')
    if bin_without_match:
        # context for bin that does not include the query term
        missing_context = get_context_time_interval(term, mock_corpus, bin_without_match, 5)
        assert missing_context == "The query term is not in the word models' vocabulary."


    # context for bin that includes the query term
    context = get_context_time_interval(term, mock_corpus, case.get('bin'), 5)

    # check format

    for item in context:
        assert_similarity_format(item)


    # check common-sense nearest neighbours
    similar_terms = [item['key'] for item in context]
    assert case.get('similar1') in similar_terms and case.get('similar2') in similar_terms

    sorted_by_similarity = sorted(context, key = lambda item : item['similarity'], reverse = True)
    most_similar_term = sorted_by_similarity[0]['key']
    assert most_similar_term == case.get('similar1')

@pytest.mark.parametrize("mock_corpus, query_term", zip(WM_MOCK_CORPORA, ['she', 'participer']))
def test_diachronic_context(test_app, mock_corpus, query_term):

    word_list, word_data, times = get_diachronic_contexts(query_term, mock_corpus)
    # test format

    for item in word_list:
        assert_similarity_format(item, must_specify_time=False)

    for item in word_data:
        assert_similarity_format(item)

    bins = TEST_BINS.get(mock_corpus)

    assert len(times) == len(bins)
    for item, interval in zip(times, bins):
        start_year, end_year = interval
        assert item == '{}-{}'.format(start_year, end_year)

    # test nearest neighbours

    cases = {
        'mock-svd-ppmi-corpus': [
        {
            'term': 'elizabeth',
            'most_similar_interval': '1810-1839' # best score in pride and prejudice => first bin
        },
        {
            'term': 'alice',
            'most_similar_interval': '1840-1869', # best score in alice in wonderland => second bin
        }],
        'mock-wordvec-corpus': [
        {
            'term': 'directeur',
            'most_similar_interval': '1900-1920'
        },
        {
            'term': 'titulaires',
            'most_similar_interval': '1920-1940'
        }]
    }

    for case in cases.get(mock_corpus):
        data = [item for item in word_data if item['key'] == case['term'] and item['similarity']]
        assert data

        most_similar_interval = max(data, key = lambda point : point['similarity'])
        assert most_similar_interval['time'] == case['most_similar_interval']
