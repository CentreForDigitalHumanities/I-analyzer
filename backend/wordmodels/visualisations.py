from wordmodels.similarity import find_n_most_similar
from wordmodels.decompose import find_optimal_2d_maps

from addcorpus.load_corpus import load_corpus
from wordmodels.similarity import find_n_most_similar, term_similarity
from wordmodels.utils import load_word_models, word_in_model


NUMBER_SIMILAR = 8

def format_time_interval(start_year, end_year):
    return '{}-{}'.format(start_year, end_year)

def parse_time_interval(interval):
    return int(interval[:4]), int(interval[-4:])

def get_similarity_over_time(query_term, comparison_term, corpus_string):
    corpus = load_corpus(corpus_string)
    binned = load_word_models(corpus, True)
    data = [
        term_similarity(
            time_bin,
            query_term,
            comparison_term
        )
        for time_bin in binned
    ]
    time_labels = get_time_labels(binned)

    similarities = [
        {
            'key': comparison_term,
            'similarity': float(similarity) if similarity != None else None,
            'time': time,
        }
        for (similarity, time) in zip(data, time_labels)
    ]

    return similarities


def get_time_labels(binned_model):
    return [
        '{}-{}'.format(time_bin['start_year'], time_bin['end_year'])
        for time_bin in binned_model
    ]

def get_diachronic_contexts(query_term, corpus_string, number_similar=NUMBER_SIMILAR):
    corpus = load_corpus(corpus_string)
    complete = load_word_models(corpus)
    binned = load_word_models(corpus, binned=True)
    word_list = find_n_most_similar(
        complete,
        query_term,
        number_similar)
    if not word_list:
        return "The query term is not in the word models' vocabulary. \
        Is your query field empty, does it contain multiple words, or did you search for a stop word?"
    times = get_time_labels(binned)
    words = [word['key'] for word in word_list]
    get_similarity = lambda word, time_bin: term_similarity(
        time_bin,
        query_term,
        word
    )

    word_data = [
        {
            'key': word,
            'similarity': get_similarity(word, time_bin),
            'time': time_label
        }
        for (time_label, time_bin) in zip(times, binned) for word in words]

    data_per_timeframe = [
        find_n_most_similar(time_bin, query_term, number_similar)
        for time_bin in binned
    ]
    return word_list, word_data, times, data_per_timeframe

def remove_duplicates(items):
    return list(set(items))

def context_terms(query_terms, model, number_similar = NUMBER_SIMILAR):
    neighbours = [
        similar_term['key']
        for query_term in query_terms
        for similar_term in
        (find_n_most_similar(model, query_term, number_similar) or [])
    ]

    query_terms = [term for term in query_terms if word_in_model(term, model)]

    return remove_duplicates(query_terms + neighbours)

def get_2d_contexts_over_time(query_terms, corpus_name, number_similar = NUMBER_SIMILAR):
    """
    Given a query term and corpus, creates a scatter plot of the term's nearest neigbours for each
    time interval.
    """

    binned_models = load_word_models(corpus_name, binned = True)
    terms_per_model = [
        context_terms(query_terms, model, number_similar=number_similar)
        for model in binned_models
    ]

    data_per_timeframe = find_optimal_2d_maps(binned_models, terms_per_model)

    data = [
        {
            'time': format_time_interval(model['start_year'], model['end_year']),
            'data': data
        }
        for data, model in zip (data_per_timeframe, binned_models)
    ]

    return data
