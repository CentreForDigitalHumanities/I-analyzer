import os
from os.path import join
import pickle

from addcorpus.load_corpus import corpus_dir
from wordmodels.similarity import find_n_most_similar, similarity_with_top_terms
from wordmodels.decompose import map_to_2d
import random

from flask import current_app


NUMBER_SIMILAR = 8

def format_time_interval(start_year, end_year):
    return '{}-{}'.format(start_year, end_year)

def parse_time_interval(interval):
    return int(interval[:4]), int(interval[-4:])

def get_diachronic_contexts(query_term, corpus, number_similar=NUMBER_SIMILAR):
    complete = load_word_models(corpus, current_app.config['WM_COMPLETE_FN'])
    binned = load_word_models(corpus, current_app.config['WM_BINNED_FN'])
    word_list = find_n_most_similar(
        complete['svd_ppmi'],
        complete['transformer'],
        query_term,
        number_similar)
    if not word_list:
        return "The query term is not in the word models' vocabulary. \
        Is your query field empty, does it contain multiple words, or did you search for a stop word?"
    times = []
    words = [word['key'] for word in word_list]
    word_data = [{'label': word, 'data': []} for word in words]
    for time_bin in binned:
        word_data = similarity_with_top_terms(
            time_bin['svd_ppmi'],
            time_bin['transformer'],
            query_term,
            word_data)
        interval = format_time_interval(time_bin['start_year'], time_bin['end_year'])
        times.append(interval)
    return word_list, word_data, times


def get_context_time_interval(query_term, corpus, which_time_interval, number_similar=NUMBER_SIMILAR):
    """ Given a query term and corpus, and a number indicating the mean of the requested time interval,
    return a word list of number_similar most similar words.
    """
    binned = load_word_models(corpus, current_app.config['WM_BINNED_FN'])
    start_year, end_year = parse_time_interval(which_time_interval)
    time_bin = next((time for time in binned if time['start_year']==start_year and time['end_year']==end_year), None)
    word_list = find_n_most_similar(time_bin['svd_ppmi'],
        time_bin['transformer'],
        query_term,
        number_similar)
    if not word_list:
        return "The query term is not in the word models' vocabulary."
    word_data = [{'label': word['key'], 'data': [word['similarity']]} for word in word_list]
    return word_data


def load_word_models(corpus, path):
    try:
        wm_directory = join(corpus_dir(corpus), current_app.config['WM_PATH'])
    except KeyError:
        return "There are no word models for this corpus."
    with open(os.path.join(wm_directory, path), "rb") as f:
        wm = pickle.load(f)
    return wm


def get_2d_context(query_term, model, number_similar = NUMBER_SIMILAR):
    """
    Given a query term and set of word embeddings, return coordinates for a 2D scatter plot with the query term's
    nearest neighbours.

    Output: a list of dicts where each dict has the keys 'label' (string of the word), 'x' (float, x-coordinate),
    and 'y'(float, y-coordinate). Coordinates are scaled within [-1, 1].
    """

    neighbours = find_n_most_similar(model['svd_ppmi'], model['transformer'], query_term, number_similar + 1)
    # find_n_most_similar always excludes the term itself, resulting in one result less than number_similar
    # i.e. for 10 neighbours, we have to specify number_similar = 11

    if not neighbours:
        return [ {
            'label': query_term,
            'x': 0.0,
            'y': 0.0,
        }]

    words = [query_term] + [item['key'] for item in neighbours]
    result = map_to_2d(words, model)

    return result


def get_2d_contexts_over_time(query_term, corpus, number_similar = NUMBER_SIMILAR):
    """
    Given a query term and corpus, creates a scatter plot of the term's nearest neigbours for each
    time interval.
    """

    binned_models = load_word_models(corpus, current_app.config['WM_BINNED_FN'])

    data = [
        {
            'time': format_time_interval(model['start_year'], model['end_year']),
            'data': get_2d_context(query_term, model, number_similar)
        }
        for model in binned_models
    ]

    return data
