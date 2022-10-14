import os
from os.path import join
import pickle
from textdistance import damerau_levenshtein
from gensim.models import KeyedVectors

from addcorpus.load_corpus import corpus_dir, load_corpus
from flask import current_app

from glob import glob


def load_word_models(corpus, binned=False):
    if type(corpus)==str:
        corpus = load_corpus(corpus)
    if corpus.word_model_type == 'svd_ppmi':
        if binned:
            path = join(corpus.word_model_path, 'binned.pkl')
        else:
            path = join(corpus.word_model_path, 'complete.pkl')
        try:
            with open(path, "rb") as f:
                wm = pickle.load(f)
        except FileNotFoundError:
            return "No word models found for this corpus."
    elif corpus.word_model_type == 'word2vec':
        w2v_list = glob('{}/*.w2v'.format(corpus.word_model_path))
        analyzer = get_analyzer(corpus)
        if binned:
            wm_files = [item for item in w2v_list if not item.endswith('full.w2v')]
            wm = [
                    {
                        "start_year": wm_file.split('_')[2],
                        "end_year": wm_file.split('_')[3],
                        "word2vec": KeyedVectors.load_word2vec_format(wm_file),
                        "transformer": get_transformer(corpus, analyzer, '{}-{}'.format(wm_file.split('_')[2:3]))
                    }
                for wm_file in wm_files
                ]
        else:
            wm_file = next((item for item in w2v_list if item.endswith('full.w2v')), None)
            model = KeyedVectors.load_word2vec_format(wm_file)
            if not wm_file:
                return "No full word model found for this corpus."
            wm = {
                "start_year": wm_file.split('_')[2],
                "end_year": wm_file.split('_')[3],
                "word2vec": model,
                "transformer": get_transformer(corpus, analyzer)
            }

    return wm

def get_transformer(corpus, analyzer, time_bin=None):
    if time_bin:

            transformer = FakeVectorizer(analyzer, vocab)
        return transformer
    except:
        raise

def get_analyzer(corpus):
    analyzer_file = glob('{}/*-analyzer.pkl'.format(corpus.word_model_path))[0]
    with open(transformer_file, 'rb') as f:
        return pickle.load(f)

class FakeVectorizer:
    """ An object pretending to be a CountVectorizer """
    def __init__(transformer, vocab):
        self.analyzer = analyzer
        self.vocab = vocab

    def get_feature_names(self):
        """ get_feature_names is deprecated sklearn>=1.0 """
        return self.vocab

    def get_feature_names_out(self):
        """ therefore, we also implement get_feature_names_out """
        return self.vocab

    def build_analyzer(self):
        return self.analyzer

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


def load_wm_documentation(corpus_string):
    corpus = load_corpus(corpus_string)
    try:
        wm_directory = corpus.word_model_path
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
