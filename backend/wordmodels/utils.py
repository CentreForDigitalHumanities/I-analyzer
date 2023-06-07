import os
from os.path import basename, dirname, exists, join, splitext
import pickle
from string import punctuation
from textdistance import damerau_levenshtein
from gensim.models import KeyedVectors

from addcorpus.load_corpus import corpus_dir, load_corpus
from flask import current_app

from glob import glob


def load_word_models(corpus):
    if type(corpus)==str:
        corpus = load_corpus(corpus)
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


def load_wm_documentation(corpus_string):
    corpus = load_corpus(corpus_string)
    corpus_dir = dirname(current_app.config['CORPORA'][corpus_string])
    description_file = join(corpus_dir, 'wm', 'documentation.md')
    if exists(description_file):
        with open(description_file) as f:
            contents = f.read()
            return contents
    else:
        return None

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
