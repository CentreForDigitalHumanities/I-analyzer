import os
from os.path import basename, exists, join, splitext
import pickle
from string import punctuation
from textdistance import damerau_levenshtein
from gensim.models import KeyedVectors

from addcorpus.python_corpora.load_corpus import corpus_dir, load_corpus_definition

from glob import glob


def load_word_models(corpus):
    if type(corpus)==str:
        corpus = load_corpus_definition(corpus)
    wv_list = glob('{}/*.wv'.format(corpus.word_model_path))
    wv_list.sort()
    wm = [
            {
                "start_year": get_year(wm_file, 1),
                "end_year": get_year(wm_file, 2),
                "vectors": KeyedVectors.load(wm_file),
            }
        for wm_file in wv_list
    ]
    return wm

def get_year(kv_filename, position):
    return int(splitext(basename(kv_filename))[0].split('_')[position])

def word_in_models(query_term, corpus, max_distance=2):
    models = load_word_models(corpus)
    transformed_query = transform_query(query_term)
    vocab = set()
    for model in models:
        vocab.update(model['vectors'].index_to_key)
    if transformed_query in list(vocab):
        return { 'exists': True }
    # if word is not in vocab, search for close matches
    is_similar = lambda term : damerau_levenshtein(query_term, term) <= max_distance
    similar_keys = [term for term in list(vocab) if is_similar(term)]
    return {
        'exists': False,
        'similar_keys': similar_keys
    }


def word_in_model(query_term, wm):
    return query_term in wm['vectors']


def transform_query(query):
    if not has_whitespace(query):
        transformed = strip_punctuation(query).lower()
        return transformed if transformed != '' else None

def has_whitespace(query):
    return ' ' in query

def strip_punctuation(query):
    return query.strip(punctuation)

def term_to_index(query, model):
    transformed = transform_query(query)
    if transformed and transformed in model['vocab']:
        return model['transformer'].vocabulary_[transformed]

def index_to_term(index, vocab):
    return vocab[index]


def time_label(model):
    start_year = model['start_year']
    end_year = model['end_year']
    return f'{start_year}-{end_year}'


def time_labels(models, sort=False):
    ordered = sorted(models, key=lambda wm: wm['start_year']) if sort else models
    return [
        time_label(wm) for wm in ordered
    ]

