import numpy as np

from addcorpus.load_corpus import load_corpus
import wordmodels.similarity as similarity
from wordmodels.visualisations import load_word_models

def test_cosine_similarity_vectors():
    cases = [
        {
            'v1': np.array([1.0, 1.0]),
            'v2': np.array([0.5, 0.5]),
            'similarity': 1.0
        },
        {
            'v1': np.array([1.0, 0.0]),
            'v2': np.array([0.0, 1.0]),
            'similarity': 0.0,
        },
    ]

    for case in cases:
        output = similarity.cosine_similarity_vectors(case['v1'], case['v2'])

        # check output with small error margin
        assert round(output, 8) == case['similarity']

def test_cosine_similarity_matrix_vector():
    cases = [
        {
            'v': np.array([1.0, 1.0]),
            'M': np.array([[1.0, 0.0], [1.0, 0.0]]),
            'similarity': np.array([0.5, 0.5]),
        }
    ]

    for case in cases:
        output = similarity.cosine_similarity_vectors(case['v'], case['M'])

        # check output with small error margin
        assert np.all(np.round(output, 8) == case['similarity'])

def test_term_similarity(test_app):
    corpus = load_corpus('mock-corpus')
    binned_models = load_word_models(corpus, True)
    model = binned_models[0]
    wm_type = corpus.word_model_type

    similarity1 = similarity.term_similarity(model, wm_type, 'elizabeth', 'she')
    assert type(similarity1) == float

    similarity2 = similarity.term_similarity(model, wm_type, 'elizabeth', 'he')

    assert similarity1 > similarity2
