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
    transformed_query = transform_query(query_term, transformer)

    if transformed_query in transformer.get_feature_names_out():
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

def transform_query(query, transformer):
    analyzer = transformer.build_analyzer()
    transformed = analyzer(query)

    if len(transformed) == 1:
        return transformed[0]

def term_to_index(query, transformer):
    transformed = transform_query(query, transformer)
    if transformed and transformed in transformer.vocabulary_:
        return transformer.vocabulary_[transformed]

def index_to_term(index, transformer):
    return transformer.get_feature_names_out()[index]

def term_to_vector(query, transformer, matrix):
    index = term_to_index(query, transformer)

    if index != None:
        return matrix[:, index]
