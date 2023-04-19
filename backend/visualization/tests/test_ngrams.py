from random import sample
from typing import Counter
from visualization import query, ngram
from visualization.tests.mock_corpora.small_mock_corpus import SmallMockCorpus
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

def test_total_time_interval_no_filter(basic_query, mock_corpus, select_small_mock_corpus, mock_corpus_specs):
    # no date filter: should use corpus min_date/max_date
    min_date, max_date = ngram.get_total_time_interval(basic_query, mock_corpus)
    assert min_date == mock_corpus_specs['min_date']
    assert max_date == mock_corpus_specs['max_date']

def test_total_time_interval_with_filter(mock_corpus, basic_query):
    datefilter = query.make_date_filter(FILTER_MIN_DATE, FILTER_MAX_DATE)
    query_with_date_filter = query.add_filter(basic_query, datefilter)

    # should use min_date/max_date specified in date filter (1850-1859)
    min_date, max_date = ngram.get_total_time_interval(query_with_date_filter, mock_corpus)
    assert min_date == FILTER_MIN_DATE
    assert max_date == FILTER_MAX_DATE

def test_time_bins(mock_corpus, select_small_mock_corpus, basic_query):
    # 100 year interval
    bins = ngram.get_time_bins(basic_query, mock_corpus)
    target_bins = CENTURY_BINS
    assert bins == target_bins

    # 10 year interval
    datefilter = query.make_date_filter(FILTER_MIN_DATE, FILTER_MAX_DATE)
    query_with_date_filter = query.add_filter(basic_query, datefilter)
    bins = ngram.get_time_bins(query_with_date_filter, mock_corpus)
    target_bins = [
        (1850, 1850), (1851, 1851),
        (1852, 1852), (1853, 1853),
        (1854, 1854), (1855, 1855),
        (1856, 1856), (1857, 1857),
        (1858, 1858), (1859, 1859)
    ]
    assert bins == target_bins

def test_short_interval(mock_corpus, select_small_mock_corpus, basic_query):
    start_date = datetime(year=1850, month=1, day=1)
    end_date = datetime(year=1850, month=12, day=31)
    date_filter = query.make_date_filter(start_date, end_date)
    short_query = query.add_filter(basic_query, date_filter)

    bins = ngram.get_time_bins(short_query, mock_corpus)

    assert bins == [(1850, 1850)]

    start_date = datetime(year=1850, month=1, day=1)
    end_date = datetime(year=1851, month=12, day=31)
    date_filter = query.make_date_filter(start_date, end_date)
    short_query = query.add_filter(basic_query, date_filter)

    bins = ngram.get_time_bins(short_query, 'mock-corpus')

    assert bins == [(1850, 1850), (1851, 1851)]



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

    output_absolute = ngram.get_top_n_ngrams(counts)
    for word in target_data:
        dataset_absolute = next(series for series in output_absolute if series['label'] == word)
        assert dataset_absolute['data'] == target_data[word]


    output_relative = ngram.get_top_n_ngrams(counts, ttf)

    for word in target_data:
        dataset_relative = next(series for series in output_relative if series['label'] == word)
        relative_frequencies = {
            w: [c / ttf[w] for c in target_data[w]]
            for w in target_data }
        assert dataset_relative['data'] == relative_frequencies[word]



def test_absolute_bigrams(mock_corpus, select_small_mock_corpus, index_mock_corpus, basic_query):
    # search for a word that occurs a few times
    frequent_query = query.set_query_text(basic_query, 'to')



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

    result = ngram.get_ngrams(frequent_query, mock_corpus, 'content', freq_compensation=False)

    assert result['time_points'] == ['{}-{}'.format(start, end) for start, end in CENTURY_BINS]

    for bigram in bigrams:
        data = next((item for item in result['words'] if item['label'] == bigram['label']), None)
        assert data

        for bin, freq in enumerate(data['data']):
            if bin in bigram['frequencies_per_bin']:
                assert freq == bigram['frequencies_per_bin'][bin]
            else:
                assert freq == 0

def test_bigrams_with_quote(mock_corpus, select_small_mock_corpus, index_mock_corpus, basic_query):
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
        case_query = query.set_query_text(basic_query, case['query'])

        result = ngram.get_ngrams(case_query, mock_corpus, 'content', freq_compensation=False)

        ngrams = case['ngrams']

        assert len(result['words']) == len(ngrams)

        for trigram in ngrams:
            data = next((item for item in result['words'] if item['label'] == trigram), None)
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

def test_number_of_ngrams(mock_corpus, select_small_mock_corpus, index_mock_corpus, basic_query):
    # search for a word that occurs a few times
    frequent_query = query.set_query_text(basic_query, 'to')

    max_frequency = 6

    for size in range(1, max_frequency + 2):
        result = ngram.get_ngrams(frequent_query, mock_corpus, 'content', number_of_ngrams= size)
        series = result['words']

        assert len(series) == min(max_frequency, size)