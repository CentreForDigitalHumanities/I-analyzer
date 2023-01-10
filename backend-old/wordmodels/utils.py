import os
from os.path import basename, dirname, exists, join, splitext
import pickle
from textdistance import damerau_levenshtein
from gensim.models import KeyedVectors

from addcorpus.load_corpus import corpus_dir, load_corpus
from flask import current_app

from glob import glob


def load_word_models(corpus, binned=False):
    if type(corpus)==str:
        corpus = load_corpus(corpus)
    w2v_list = glob('{}/*.w2v'.format(corpus.word_model_path))
    full_model = next((item for item in w2v_list if item.endswith('full.w2v')), None)
    try:
        w2v_list.remove(full_model)
    except:
       raise(Exception("No full word model found for this corpus."))
    analyzer = get_analyzer(corpus)
    if binned:
        w2v_list.sort()
        wm = [
                {
                    "start_year": get_year(wm_file, 1),
                    "end_year": get_year(wm_file, 2),
                    "matrix": KeyedVectors.load_word2vec_format(wm_file, binary=True),
                    "analyzer": analyzer,
                    "vocab": get_vocab(wm_file)
                }
            for wm_file in w2v_list
            ]
    else:
        model = KeyedVectors.load_word2vec_format(full_model, binary=True)
        wm = {
            "start_year": get_year(full_model, 1),
            "end_year": get_year(full_model, 2),
            "matrix": model,
            "analyzer": analyzer,
            "vocab": get_vocab(full_model)
        }
    return wm

def get_vocab(kv_filename):
    vocab_name = '{}_vocab.pkl'.format(splitext(kv_filename)[0])
    with open(vocab_name, 'rb') as f:
        return pickle.load(f)

def get_year(kv_filename, position):
    return int(splitext(basename(kv_filename))[0].split('_')[position])

def get_analyzer(corpus):
    analyzer_file = glob('{}/*analyzer.pkl'.format(corpus.word_model_path))[0]
    with open(analyzer_file, 'rb') as f:
        return pickle.load(f)

def word_in_model(query_term, corpus, max_distance = 2):
    model = load_word_models(corpus)
    analyzer = model['analyzer']
    vocab = model['vocab']
    transformed_query = transform_query(query_term, analyzer)

    if transformed_query in model['vocab']:
        return { 'exists': True }
    else:
        is_similar = lambda term : damerau_levenshtein(query_term, term) <= max_distance
        similar_keys = [term for term in vocab if is_similar(term)]

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

def transform_query(query, analyzer):
    transformed = analyzer(query)

    if len(transformed) == 1:
        return transformed[0]

def term_to_index(query, model):
    transformed = transform_query(query, model['analyzer'])
    if transformed and transformed in model['vocab']:
        return model['transformer'].vocabulary_[transformed]

def index_to_term(index, vocab):
    return vocab[index]
