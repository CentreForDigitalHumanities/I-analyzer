import numpy as np

from addcorpus.load_corpus import load_corpus
from wordmodels.utils import load_word_models, term_to_vector, word_in_model, transform_query
from wordmodels.conftest import TEST_VOCAB_SIZE, TEST_DIMENSIONS, TEST_BINS
from wordmodels.utils import load_wm_documentation

def test_complete_import(test_app):
    corpus = load_corpus('mock-corpus')
    model = load_word_models(corpus)
    assert model

    weights = model['svd_ppmi']
    assert weights.shape == (TEST_DIMENSIONS, TEST_VOCAB_SIZE)

    transformer = model['transformer']
    assert transformer.max_features == TEST_VOCAB_SIZE

def test_binned_import(test_app):
    corpus = load_corpus('mock-corpus')
    models = load_word_models(corpus, binned=True)
    assert len(models) == len(TEST_BINS)

    for model, bin in zip(models, TEST_BINS):
        start_year, end_year = bin

        assert model['start_year'] == start_year
        assert model['end_year'] == end_year

        weights = model['svd_ppmi']
        assert weights.shape == (TEST_DIMENSIONS, TEST_VOCAB_SIZE)

        transformer = model['transformer']
        assert transformer.max_features == TEST_VOCAB_SIZE

def test_word_in_model(test_app):
    cases = [
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
    ]

    for case in cases:
        corpus = load_corpus('mock-corpus')
        result = word_in_model(case['term'], corpus, 1)
        assert result == case['expected']

def test_term_to_vector(test_app):
    corpus = load_corpus('mock-corpus')
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
    corpus = load_corpus('mock-corpus')
    description = load_wm_documentation(corpus)
    assert description == 'Description for testing.\n'

def test_query_transform(test_app):
    corpus = load_corpus('mock-corpus')
    model = load_word_models(corpus)

    cases = [
        ('whale', 'whale'),
        ('Whale!', 'whale'),
        ('!?%)#', None),
        ('multiple words', None)
    ]

    for query, expected in cases:
        transformed = transform_query(query, model['transformer'])
        assert transformed == expected
