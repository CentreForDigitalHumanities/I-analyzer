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

    output_absolute = analyze.get_top_10_ngrams(counts)
    for word in target_data:
        dataset_absolute = next(series for series in output_absolute if series['label'] == word)
        assert dataset_absolute['data'] == target_data[word]
    

    output_relative = analyze.get_top_10_ngrams(counts, ttf)

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
