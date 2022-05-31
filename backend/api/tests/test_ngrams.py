from cmath import exp
import enum
from random import sample
from typing import Counter
import api.analyze as analyze
import api.query as query
from mock_corpus import MockCorpus
from datetime import datetime
import pytest

FILTER_MIN_DATE = datetime(1850, 1, 1)
FILTER_MAX_DATE = datetime(1859, 12, 31)

CENTURY_BINS = [
    (1800, 1804), (1805, 1809),
    (1810, 1814), (1815, 1819),
    (1820, 1824), (1825, 1829),
    (1830, 1834), (1835, 1839),
    (1840, 1844), (1845, 1849),
    (1850, 1854), (1855, 1859),
    (1860, 1864), (1865, 1869),
    (1870, 1874), (1875, 1879),
    (1880, 1884), (1885, 1889),
    (1890, 1894), (1895, 1899)
]

def test_total_time_interval_no_filter(test_app, basic_query):
    # no date filter: should use corpus min_date/max_date
    min_date, max_date = analyze.get_total_time_interval(basic_query, 'mock-corpus')
    assert min_date == MockCorpus.min_date
    assert max_date == MockCorpus.max_date

def test_total_time_interval_with_filter(test_app, basic_query):
    datefilter = query.make_date_filter(FILTER_MIN_DATE, FILTER_MAX_DATE)
    query_with_date_filter = query.add_filter(basic_query, datefilter)

    # should use min_date/max_date specified in date filter (1850-1859)
    min_date, max_date = analyze.get_total_time_interval(query_with_date_filter, 'mock_corpus')
    assert min_date == FILTER_MIN_DATE
    assert max_date == FILTER_MAX_DATE

def test_time_bins(test_app, basic_query):
    # 100 year interval
    bins = analyze.get_time_bins(basic_query, 'mock-corpus')
    target_bins = CENTURY_BINS
    assert bins == target_bins

    # 10 year interval
    datefilter = query.make_date_filter(FILTER_MIN_DATE, FILTER_MAX_DATE)
    query_with_date_filter = query.add_filter(basic_query, datefilter)
    bins = analyze.get_time_bins(query_with_date_filter, 'mock-corpus')
    target_bins = [
        (1850, 1850), (1851, 1851),
        (1852, 1852), (1853, 1853),
        (1854, 1854), (1855, 1855),
        (1856, 1856), (1857, 1857),
        (1858, 1858), (1859, 1859)
    ]
    assert bins == target_bins
    

def test_top_10_ngrams():
    docs = [
        ['a', 'b'],
        ['a', 'b', 'c'],
        ['a', 'c']
    ]

    counts = [Counter(doc) for doc in docs]

    target_data = {
        'a': [1, 1, 1],
        'b': [1, 1, 0],
        'c': [0, 1, 1]
    }
   
    ttf = {
        'a': 100,
        'b': 200,
        'c': 150,
    }

    output_absolute = analyze.get_top_n_ngrams(counts)
    for word in target_data:
        dataset_absolute = next(series for series in output_absolute if series['label'] == word)
        assert dataset_absolute['data'] == target_data[word]
    

    output_relative = analyze.get_top_n_ngrams(counts, ttf)

    for word in target_data:
        dataset_relative = next(series for series in output_relative if series['label'] == word)
        relative_frequencies = {
            w: [c / ttf[w] for c in target_data[w]]
            for w in target_data }
        assert dataset_relative['data'] == relative_frequencies[word]

def test_absolute_bigrams(test_app, test_es_client, basic_query):
    if not test_es_client:
        pytest.skip('No elastic search client')

    # search for a word that occurs a few times
    query = basic_query
    query['query']['bool']['must']['simple_query_string']['query'] = 'to'

    # expected bigram frequencies
    bigrams = [
        {
            'label': 'rejoice to',
            'frequencies_per_bin': {
                3: 1 # read as: bin 3 has a frequency of 1, all others 0
            }
        },
        {
            'label': 'to hear',
            'frequencies_per_bin': {
                3: 1
            }
        },
        {
            'label': 'beginning to',
            'frequencies_per_bin': {
                13: 1
            }
        },
        {
            'label': 'to get',
            'frequencies_per_bin': {
                13: 1
            }
        },
        {
            'label': 'nothing to',
            'frequencies_per_bin': {
                13: 1
            }
        },
        {
            'label': 'to do',
            'frequencies_per_bin': {
                13: 1
            }
        }
    ]

    result = analyze.get_ngrams(query, 'mock-corpus', 'content', freq_compensation=False)

    assert result['time_points'] == ['{}-{}'.format(start, end) for start, end in CENTURY_BINS]

    for ngram in bigrams:
        data = next((item for item in result['words'] if item['label'] == ngram['label']), None)
        assert data

        for bin, freq in enumerate(data['data']):
            if bin in ngram['frequencies_per_bin']:
                assert freq == ngram['frequencies_per_bin'][bin]
            else:
                assert freq == 0

def test_bigrams_with_quote(test_app, test_es_client, basic_query):
    if not test_es_client:
        pytest.skip('No elastic search client')

    cases = [
        {
            'query': '"to hear"',
            'ngrams': [
                'rejoice to hear',
                'to hear that'
            ]
        }, {
            'query': '"to hear", "to do"',
            'ngrams': {
                'rejoice to hear',
                'to hear that',
                'nothing to do',
            }
        }, {
            'query': '"single man" fortune',
            'ngrams': {
                'a single man',
                'single man in',
                'good fortune',
                'fortune must',
            }
        }
    ]
    
    for case in cases:
        # search for a word that occurs a few times
        query = basic_query
        query['query']['bool']['must']['simple_query_string']['query'] = case['query']

        result = analyze.get_ngrams(query, 'mock-corpus', 'content', freq_compensation=False)

        ngrams = case['ngrams']

        assert len(result['words']) == len(ngrams)

        for ngram in ngrams:
            data = next((item for item in result['words'] if item['label'] == ngram), None)
            assert data

TOKENS_EXAMPLE = [
    {
        'position': 0,
        'term': 'You',
    },
    {
        'position': 2,
        'term': 'rejoice',
    },
    {
        'position': 4,
        'term': 'hear',
    },
    {
        'position': 7,
        'term': 'disaster'
    },
    {
        'position': 9,
        'term': 'accompanied'
    },
    {
        'position': 14,
        'term': 'enterprise'
    },
    {
        'position': 18,
        'term': 'regarded'
    },
    {
        'position': 21,
        'term': 'evil'
    },
    {
        'position': 22,
        'term': 'forebodings'
    }
]

def shuffle(lst):
    '''returns list/iterator in random order.
    Preferred to `random.shuffle` because that function is in-place'''
    return sample(lst, k=len(lst))

def test_find_adjacent_token():
    for (i, token) in enumerate(TOKENS_EXAMPLE):
        # shuffle order and let function identify adjacent tokens
        shuffled_tokens = shuffle(TOKENS_EXAMPLE)
        found_next = analyze.find_next_token(token, shuffled_tokens)
        found_prev = analyze.find_previous_token(token, shuffled_tokens)

        if i < len(TOKENS_EXAMPLE) - 1:
            expected_next = TOKENS_EXAMPLE[i + 1]
        else:
            expected_next = None

        assert expected_next == found_next

        if i > 0:
            expected_prev = TOKENS_EXAMPLE[i - 1]
        else:
            expected_prev = None
        
        assert expected_prev == found_prev

def test_find_adjacent_tokens():
    for (i, token) in enumerate(TOKENS_EXAMPLE):
        for n in range(1,3):
            print('TERM:', token['term'])
            print('ORDER:', n)
            # shuffle order and let function identify adjacent tokens
            shuffled_tokens = shuffle(TOKENS_EXAMPLE)
            found_next = analyze.find_next_tokens(token, shuffled_tokens, n)
            found_prev = analyze.find_previous_tokens(token, shuffled_tokens, n)

            if i < len(TOKENS_EXAMPLE) - 1:
                stop_index = min(len(TOKENS_EXAMPLE) + 1, i + n + 1)
                expected_next = TOKENS_EXAMPLE[i + 1 : stop_index]
            else:
                expected_next = []

            assert expected_next == found_next

            if i > 0:
                start_index = max(0, i - n)
                expected_prev = TOKENS_EXAMPLE[start_index : i]
            else:
                expected_prev = []

            if expected_prev != found_prev:
                print('EXPECTED:', expected_prev)
                print('FOUND:', found_prev)
            assert expected_prev == found_prev

def test_find_ngrams():
    cases = [
        {
            'index': 3,
            'ngram_size': 2,
            'positions': [0,1],
            'expected': [(2,4), (3,5)]
        },
        {
            'index': 0,
            'ngram_size': 2,
            'positions': [0,1],
            'expected': [(0,2)]
        },
        {
            'index': 3,
            'ngram_size': 3,
            'positions': [0,1,2],
            'expected': [(1,4), (2,5), (3,6)]
        },
        {
            'index': 3,
            'ngram_size': 3,
            'positions': [0],
            'expected': [(3,6)]
        },
        {
            'index': 3,
            'ngram_size': 3,
            'positions': [2],
            'expected': [(1,4)]
        }
    ]

    for case in cases:
        shuffled_tokens = shuffle(TOKENS_EXAMPLE)
        token = TOKENS_EXAMPLE[case['index']]
        found = analyze.find_ngrams(token,
            shuffled_tokens,
            ngram_size = case['ngram_size'],
            positions = case['positions']
        )
        expected = [ TOKENS_EXAMPLE[start:stop] for start, stop in case['expected'] ]

        start_position = lambda ngram: ngram[0]['position']
        sort_by_position = lambda ngrams: sorted(ngrams, key=start_position)

        assert sort_by_position(found) == sort_by_position(expected)

def test_number_of_ngrams(test_app, test_es_client, basic_query):
    if not test_es_client:
        pytest.skip('No elastic search client')

    # search for a word that occurs a few times
    query = basic_query
    query['query']['bool']['must']['simple_query_string']['query'] = 'to'

    max_frequency = 6

    for size in range(1, max_frequency + 2):
        result = analyze.get_ngrams(query, 'mock-corpus', 'content', number_of_ngrams= size)
        series = result['words']

        assert len(series) == min(max_frequency, size)
