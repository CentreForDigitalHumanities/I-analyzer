from functools import reduce
from operator import concat
import numpy as np
import pandas as pd

from flask import current_app

from addcorpus.load_corpus import load_corpus
from wordmodels.similarity import find_n_most_similar, term_similarity
from wordmodels.utils import load_word_models


NUMBER_SIMILAR = 8

def get_similarity_over_time(query_term, comparison_term, corpus_string):
    corpus = load_corpus(corpus_string)
    wm_list = load_word_models(corpus)
    data = [
        term_similarity(
            time_bin,
            query_term,
            comparison_term
        )
        for time_bin in wm_list
    ]
    time_labels = get_time_labels(wm_list)

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
    wm_list = load_word_models(corpus)
    times = get_time_labels(wm_list)
    data_per_timeframe = [
        find_n_most_similar(time_bin, query_term, number_similar*2)
        for time_bin in wm_list
    ]
    flattened_data = reduce(concat, data_per_timeframe)
    all_words = list(set([item.get('key') for item in flattened_data]))
    frequencies = {word: [] for word in all_words}
    for item in flattened_data:
        frequencies[item['key']].append(item['similarity'])
    means = pd.DataFrame({'word': all_words, 'mean': [np.mean(f) for f in frequencies.values()]})
    words = means.nlargest(number_similar, 'mean')['word']

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
        for (time_label, time_bin) in zip(times, wm_list) for word in words]

    return word_data, times, data_per_timeframe
