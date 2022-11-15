from flask import current_app

from addcorpus.load_corpus import load_corpus
from wordmodels.similarity import find_n_most_similar, term_similarity
from wordmodels.utils import load_word_models


NUMBER_SIMILAR = 8

def get_similarity_over_time(query_term, comparison_term, corpus_string):
    corpus = load_corpus(corpus_string)
    binned = load_word_models(corpus, True)
    wm_type = corpus.word_model_type
    data = [
        term_similarity(
            time_bin,
            wm_type,
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
    wm_type = corpus.word_model_type
    complete = load_word_models(corpus)
    binned = load_word_models(corpus, binned=True)
    word_list = find_n_most_similar(
        complete,
        wm_type,
        query_term,
        number_similar)
    if not word_list:
        return "The query term is not in the word models' vocabulary. \
        Is your query field empty, does it contain multiple words, or did you search for a stop word?"
    times = get_time_labels(binned)
    words = [word['key'] for word in word_list]
    get_similarity = lambda word, time_bin: term_similarity(
        time_bin,
        wm_type,
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

    return word_list, word_data, times


def get_context_time_interval(query_term, corpus_string, which_time_interval, number_similar=NUMBER_SIMILAR):
    """ Given a query term and corpus, and a number indicating the mean of the requested time interval,
    return a word list of number_similar most similar words.
    """
    corpus = load_corpus(corpus_string)
    wm_type = corpus.word_model_type
    binned = load_word_models(corpus, binned=True)
    start_year, end_year = which_time_interval.split('-')
    time_bin = next((time for time in binned if time['start_year']==int(start_year) and
        time['end_year']==int(end_year)), None)
    time_label = '{}-{}'.format(time_bin['start_year'], time_bin['end_year'])
    word_list = find_n_most_similar(
        time_bin,
        wm_type,
        query_term,
        number_similar)
    if not word_list:
        return "The query term is not in the word models' vocabulary."
    word_data = [
        {
            'key': word['key'],
            'similarity': word['similarity'],
            'time': time_label
        }
        for word in word_list
    ]
    return word_data
