from typing import Counter
import api.analyze as analyze
from mock_corpus import MockCorpus
from datetime import datetime

def test_total_time_interval_no_filter(test_app, basic_query):
    # no date filter: should use corpus min_date/max_date
    min_date, max_date = analyze.get_total_time_interval(basic_query, 'mock-corpus')
    assert min_date == MockCorpus.min_date
    assert max_date == MockCorpus.max_date

def test_total_time_interval_with_filter(test_app, query_with_date_filter):
    # should use min_date/max_date specified in date filter (1850-1859)
    min_date, max_date = analyze.get_total_time_interval(query_with_date_filter, 'mock_corpus')
    assert min_date == datetime(1850, 1, 1)
    assert max_date == datetime(1859, 12, 31)

def test_time_bins(test_app, basic_query, query_with_date_filter):
    # 100 year interval
    bins = analyze.get_time_bins(basic_query, 'mock-corpus')
    target_bins = [
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
    assert bins == target_bins

    # 10 year interval
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
