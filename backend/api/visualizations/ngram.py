from collections import Counter
from sqlalchemy.orm import query
from addcorpus.load_corpus import load_corpus
from datetime import datetime
from es.search import get_index, search
from ianalyzer.factories.elasticsearch import elasticsearch
import api.query as query
import api.termvectors as termvectors
from es import download as download


def get_ngrams(es_query, corpus, field,
    ngram_size=2, positions='any', freq_compensation=True, subfield='none', max_size_per_interval=50,
    number_of_ngrams=10, date_field = 'date'):
    """Given a query and a corpus, get the words that occurred most frequently around the query term"""

    bins = get_time_bins(es_query, corpus)
    time_labels = ['{}-{}'.format(start_year, end_year) for start_year, end_year in bins]

    positions_dict = {
        'any': list(range(ngram_size)),
        'first': [0],
        'second': [1],
        'third': [2],
        'fourth': [3],
    }
    term_positions = positions_dict[positions]

    # find ngrams

    docs, total_frequencies = tokens_by_time_interval(
        corpus, es_query, field, bins, ngram_size, term_positions, freq_compensation, subfield, max_size_per_interval,
        date_field
    )
    if freq_compensation:
        ngrams = get_top_n_ngrams(docs, total_frequencies, number_of_ngrams)
    else:
        ngrams = get_top_n_ngrams(docs, dict(), number_of_ngrams)

    return { 'words': ngrams, 'time_points' : time_labels }


def get_total_time_interval(es_query, corpus):
    """
    Min and max date for the search query and corpus. Returns the dates from the query if provided,
    otherwise the min and max date from the corpus definition.
    """

    query_min, query_max = query.get_date_range(es_query)

    if query_min and query_max:
        return query_min, query_max

    corpus_class = load_corpus(corpus)
    corpus_min = corpus_class.min_date
    corpus_max = corpus_class.max_date

    min_date = query_min if query_min and query_min > corpus_min else corpus_min
    max_date = query_max if query_max and query_max < corpus_max else corpus_max

    return min_date, max_date


def get_time_bins(es_query, corpus):
    """Wide bins for a query. Depending on the total time range of the query, time intervervals are
    10 years (>100 yrs), 5 years (100-20 yrs) of 1 year (<20 yrs)."""

    min_date, max_date = get_total_time_interval(es_query, corpus)
    min_year, max_year = min_date.year, max_date.year
    time_range = max_year - min_year

    if time_range < 1:
        year_step = None
    elif time_range <= 20:
        year_step = 1
    elif time_range <= 100:
        year_step = 5
    else:
        year_step = 10

    if year_step:
        bins = [(start, min(max_year, start + year_step - 1)) for start in range(min_year, max_year, year_step)]
        bins_max = bins[-1][1]

        if bins_max < max_year:
            bins.append((bins_max + 1, max_year))

    else:
        bins = [(min_year, max_year)]

    return bins


def tokens_by_time_interval(corpus, es_query, field, bins, ngram_size, term_positions, freq_compensation, subfield, max_size_per_interval, date_field):
    index = get_index(corpus)
    client = elasticsearch(corpus)
    ngrams_per_bin = []
    ngram_ttfs = dict()

    query_text = query.get_query_text(es_query)
    field = field if subfield == 'none' else '.'.join([field, subfield])

    for (start_year, end_year) in bins:
        start_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31)

        # filter query on this time bin
        date_filter = query.make_date_filter(start_date, end_date, date_field)
        narrow_query = query.add_filter(es_query, date_filter)

        #search for the query text
        search_results = search(
            corpus=corpus,
            query_model = narrow_query,
            client = client,
            size = max_size_per_interval,
        )

        bin_ngrams = Counter()

        for hit in search_results['hits']['hits']:
            identifier = hit['_id']

            # get the term vectors for the hit
            result = client.termvectors(
                index=index,
                id=identifier,
                term_statistics=freq_compensation,
                fields = [field]
            )

            terms = termvectors.get_terms(result, field)

            if terms:
                sorted_tokens = termvectors.get_tokens(terms, sort=True)

                for match_start, match_stop, match_content in termvectors.token_matches(sorted_tokens, query_text, index, field, client):
                    for j in term_positions:
                        start = match_start - j
                        stop = match_stop - 1 - j + ngram_size
                        if start >= 0 and stop <= len(sorted_tokens):
                            ngram = sorted_tokens[start:stop]
                            words = ' '.join([token['term'] for token in ngram])
                            ttf = sum(token['ttf'] for token in ngram) / len(ngram)
                            ngram_ttfs[words] = ttf
                            bin_ngrams.update({ words: 1})

        # output per bin: all tokens from this time interval
        ngrams_per_bin.append(bin_ngrams)

    return ngrams_per_bin, ngram_ttfs


def get_top_n_ngrams(counters, total_frequencies = None, number_of_ngrams=10):
    """
    Converts a list of documents with tokens into n dataseries, listing the
    frequency of the top n tokens and their frequency in each document.

    Input:
    - `docs`: a list of Counter objects with ngram frequencies. The division into counters reflects how the data is grouped,
    i.e. by time interval. Each counter object reflects how often ngram tokens have been observed per interval. Presumably,
    each token is a string containing an ngram.
    but can be any immutable object. The division into documents reflects how the data is grouped (e.g. by time interval).
    - `total_frequencies`: dict or `None`. If a dict, it should give the total frequency for every ngram that features in `docs`. In
    practice, this is the average frequency of each word in the ngram. If the dict is provided, the frequency of the ngram will be divided
    by it.

    Output:
    A list of 10 data series. Each series is a dict with two keys: `'label'` contains the content of a token (presumably an
    ngram string), `'data'` contains a list of the frequency of that token in each document. Depending on `divide_by_ttf`,
    this is absolute or relative to the total term frequencies provided.
    """

    total_counter = Counter()
    for c in counters:
        total_counter.update(c)

    number_of_results = min(number_of_ngrams, len(total_counter))

    if total_frequencies:
        def frequency(ngram, counter): return counter[ngram] / total_frequencies[ngram]
        def overall_frequency(ngram): return frequency(ngram, total_counter)
        top_ngrams = sorted(total_counter.keys(), key=overall_frequency, reverse=True)[:number_of_results]
    else:
        def frequency(ngram, counter): return counter[ngram]
        top_ngrams = [word for word, freq in total_counter.most_common(number_of_results)]


    output = [{
            'label': ngram,
            'data': [frequency(ngram, c)
                for c in counters]
        }
        for ngram in top_ngrams]

    return output
