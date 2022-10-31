import numpy as np

import pytest

from addcorpus.load_corpus import load_corpus
from wordmodels.utils import load_word_models, term_to_vector, word_in_model, transform_query
from wordmodels.conftest import TEST_VOCAB_SIZE, TEST_DIMENSIONS, TEST_BINS, WM_MOCK_CORPORA, WM_TYPES
from wordmodels.utils import load_wm_documentation

@pytest.mark.parametrize("mock_corpus, wm_type", zip(WM_MOCK_CORPORA, WM_TYPES))
def test_complete_import(test_app, mock_corpus, wm_type):
    corpus = load_corpus(mock_corpus)
    model = load_word_models(corpus)
    assert model

    weights = model[wm_type]
    if wm_type == 'svd_ppmi':
        assert weights.shape[0] == TEST_DIMENSIONS
        vocab = model['vocab']
        assert len(vocab) == TEST_VOCAB_SIZE
    elif wm_type == 'word2vec': # vocab size is not deterministic
        assert weights.vector_size == TEST_DIMENSIONS


@pytest.mark.parametrize("mock_corpus, wm_type", zip(WM_MOCK_CORPORA, WM_TYPES))
def test_binned_import(test_app, mock_corpus, wm_type):
    corpus = load_corpus(mock_corpus)
    models = load_word_models(corpus, binned=True)
    test_bins = TEST_BINS.get(mock_corpus)
    assert len(models) == len(test_bins)

    for model, t_bin in zip(models, test_bins):
        start_year, end_year = t_bin

        assert model['start_year'] == start_year
        assert model['end_year'] == end_year

        weights = model[wm_type]
        if wm_type == 'svd_ppmi':
            assert weights.shape[0] == TEST_DIMENSIONS
            vocab = model['vocab']
            assert len(vocab) == TEST_VOCAB_SIZE
        elif wm_type == 'word2vec': # vocab size is not deterministic
            assert weights.vector_size == TEST_DIMENSIONS

@pytest.mark.parametrize("mock_corpus", WM_MOCK_CORPORA)
def test_word_in_model(test_app, mock_corpus):
    CASES = {
        'mock-svd-ppmi-corpus': [
            {
                'term': 'she',
                'expected': {'exists': True}
            },
            {
                'term':  'whale',
                'expected': {'exists': True}
            },
            {
                'term':  'Whale!',
                'expected': {'exists': True}
            },
            {
                'term':  'hwale',
                'expected': {'exists': False, 'similar_keys': ['whale']}
            }
        ],
        'mock-wordvec-corpus': [
                        {
                'term': 'ils',
                'expected': {'exists': True}
            },
            {
                'term':  'président',
                'expected': {'exists': True}
            },
            {
                'term':  'Président!',
                'expected': {'exists': True}
            },
            {
                'term':  'president',
                'expected': {'exists': False, 'similar_keys': ['président']}
            }
        ]
    }

    cases = CASES.get(mock_corpus)
    for case in cases:
        corpus = load_corpus(mock_corpus)
        result = word_in_model(case['term'], corpus, 1)
        assert result == case['expected']

def test_term_to_vector(test_app):
    corpus = load_corpus('mock-svd-ppmi-corpus')
    model = load_word_models(corpus)
    transformer = model['transformer']
    matrix = model['svd_ppmi']

    vec1 = term_to_vector('whale', transformer, matrix)
    vec2 = term_to_vector('Whale!', transformer, matrix)

    assert np.all(np.equal(vec1, vec2))
    assert type(vec1) != type(None)

    vec3 = term_to_vector('man', transformer, matrix)

    assert not np.all(np.equal(vec1, vec3))

    novec = term_to_vector('skdfjksdjfkdf', transformer, matrix)
    assert novec == None

def test_description_import(test_app):
    description = load_wm_documentation('mock-svd-ppmi-corpus')
    assert description == 'Description for testing.\n'

@pytest.mark.parametrize("mock_corpus", WM_MOCK_CORPORA)
def test_query_transform(test_app, mock_corpus):
    corpus = load_corpus(mock_corpus)
    model = load_word_models(corpus)

    cases = {
        'mock-svd-ppmi-corpus': [
            ('whale', 'whale'),
            ('Whale!', 'whale'),
            ('!?%)#', None),
            ('multiple words', None)
        ],
        'mock-wordvec-corpus': [
            ('président', 'président'),
            ('Président,', 'président'),
            ('!?%)#', None),
            ('encore une fois', None)
        ]
    }

    for query, expected in cases.get(mock_corpus):
        transformed = transform_query(query, model['analyzer'])
        assert transformed == expected
