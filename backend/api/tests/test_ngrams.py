import api.analyze as analyze
from mock_corpus import MockCorpus
from datetime import datetime

def test_total_time_interval_no_filter(test_app, basic_query):
    # no date filter: should use corpus min_date/max_date
    min_date, max_date = analyze.get_total_time_interval(basic_query, 'mock-corpus')
    assert min_date == MockCorpus.min_date
    assert max_date == MockCorpus.max_date

def test_total_time_interval_with_filter(test_app, query_with_date_filter):
    # should use min_date/max_date specified in date filter (1950-1959)
    min_date, max_date = analyze.get_total_time_interval(query_with_date_filter, 'mock_corpus')
    assert min_date == datetime(1950, 1, 1)
    assert max_date == datetime(1959, 12, 31)

def test_time_bins(test_app, basic_query, query_with_date_filter):
    # 100 year interval
    bins = analyze.get_time_bins(basic_query, 'mock-corpus')
    target_bins = [
        (1900, 1904), (1905, 1909),
        (1910, 1914), (1915, 1919),
        (1920, 1924), (1925, 1929),
        (1930, 1934), (1935, 1939),
        (1940, 1944), (1945, 1949),
        (1950, 1954), (1955, 1959),
        (1960, 1964), (1965, 1969),
        (1970, 1974), (1975, 1979),
        (1980, 1984), (1985, 1989),
        (1990, 1994), (1995, 1999)
    ]
    assert bins == target_bins

    # 10 year interval
    bins = analyze.get_time_bins(query_with_date_filter, 'mock-corpus')
    target_bins = [
        (1950, 1950), (1951, 1951),
        (1952, 1952), (1953, 1953),
        (1954, 1954), (1955, 1955),
        (1956, 1956), (1957, 1957),
        (1958, 1958), (1959, 1959)
    ]
    assert bins == target_bins
    

def test_count_ngrams():
    docs = [
        [ ('a', 100), ('b', 200)],
        [ ('b', 200), ('c', 150)],
        [ ('a', 100)]
    ]

    counts = {
        'a': [1, 0, 1],
        'b': [1, 1, 0],
        'c': [0, 1, 0]
    }
    
    ttf = {
        'a': 100,
        'b': 200,
        'c': 150,
    }

    output_absolute = analyze.count_ngrams(docs, False)
    for word in counts:
        dataset_absolute = next(series for series in output_absolute if series['label'] == word)
        assert dataset_absolute['data'] == counts[word]
    

    output_relative = analyze.count_ngrams(docs, True)

    for word in counts:
        dataset_relative = next(series for series in output_relative if series['label'] == word)
        relative_frequencies = {
            w: [c / ttf[w] for c in counts[w]]
            for w in counts }
        assert dataset_relative['data'] == relative_frequencies[word]
