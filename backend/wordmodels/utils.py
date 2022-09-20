import os
from os.path import join
import pickle
from textdistance import damerau_levenshtein

from addcorpus.load_corpus import corpus_dir
from flask import current_app


def load_word_models(corpus, binned = False):

    if binned:
        path = current_app.config['WM_BINNED_FN']
    else:
        path = current_app.config['WM_COMPLETE_FN']

    try:
        wm_directory = join(corpus_dir(corpus), current_app.config['WM_PATH'])
    except KeyError:
        return "There are no word models for this corpus."
    with open(os.path.join(wm_directory, path), "rb") as f:
        wm = pickle.load(f)
    return wm

def word_in_model(query_term, corpus, max_distance = 2):
    model = load_word_models(corpus)
    transformer = model['transformer']

    if query_term in transformer.get_feature_names_out():
        return { 'exists': True }
    else:
        is_similar = lambda term : damerau_levenshtein(query_term, term) <= max_distance
        similar_keys = [term for term in transformer.get_feature_names_out() if is_similar(term)]

        return {
            'exists': False,
            'similar_keys': similar_keys
        }


def load_wm_documentation(corpus):
    try:
        wm_directory = join(corpus_dir(corpus), current_app.config['WM_PATH'])
    except KeyError:
        return None

    description_file = 'documentation.md'
    if description_file in os.listdir(wm_directory):
        with open(join(wm_directory, description_file)) as f:
            contents = f.read()
            return contents
    else:
        return None
