from wordmodels.visualisations import get_diachronic_contexts, get_context_time_interval
from wordmodels.conftest import TEST_BINS
import numpy as np

def test_context_time_interval(test_app):
    term = 'alice'

    # context for bin that does not include the query term

    missing_context = get_context_time_interval(term, 'mock-corpus', '1810-1839', 5)
    assert missing_context == "The query term is not in the word models' vocabulary."


    # context for bin that includes the query term

    context = get_context_time_interval(term, 'mock-corpus', '1840-1869', 5)

    # check format

    for item in context:
        assert 'label' in item and 'data' in item
        label = item['label']
        assert type(label) == str
        data = item['data']
        assert len(data) == 1 and type(data[0]) == np.float64

    # check common-sense nearest neighbours

    similar_terms = [item['label'] for item in context]
    assert 'she' in similar_terms and 'her' in similar_terms

    sorted_by_similarity = sorted(context, key = lambda item : item['data'][0], reverse = True)
    most_similar_term = sorted_by_similarity[0]['label']
    assert most_similar_term == 'she'

def test_diachronic_context(test_app):
    term = 'she'

    word_list, word_data, times = get_diachronic_contexts(term, 'mock-corpus')

    # test format

    for item in word_list:
        assert 'key' in item and type(item['key']) == str

    for item in word_data:
        assert 'key' in item and type(item['key']) == str
        assert 'similarity' in item
        assert type(item['similarity']) == float or type(item['similarity']) == type(None)
        assert 'time' in item and type(item['time']) == str


    assert len(times) == len(TEST_BINS)
    for item, interval in zip(times, TEST_BINS):
        start_year, end_year = interval
        assert item == '{}-{}'.format(start_year, end_year)

    # test nearest neighbours

    cases = [
        {
            'term': 'elizabeth',
            'most_similar_interval': '1810-1839' # best score in pride and prejudice => first bin
        },
        {
            'term': 'alice',
            'most_similar_interval': '1840-1869', # best score in alice in wonderland => second bin
        }
    ]

    for case in cases:
        data = [item for item in word_data if item['key'] == case['term'] and item['similarity']]
        assert data

        most_similar_interval = max(data, key = lambda point : point['similarity'])
        assert most_similar_interval['time'] == case['most_similar_interval']
