import numpy as np

import pytest

from addcorpus.load_corpus import load_corpus
from wordmodels.utils import load_word_models, word_in_models, transform_query
from wordmodels.conftest import TEST_VOCAB_SIZE, TEST_DIMENSIONS, TEST_BINS
from wordmodels.utils import load_wm_documentation

def test_import(test_app, mock_corpus):
    corpus = load_corpus(mock_corpus)
    models = load_word_models(corpus)
    assert len(models) == len(TEST_BINS)

    for model, t_bin in zip(models, TEST_BINS):
        start_year, end_year = t_bin

        assert model['start_year'] == start_year
        assert model['end_year'] == end_year

        weights = model['vectors']

        assert weights.vector_size == TEST_DIMENSIONS
        vocab = weights.index_to_key
        assert len(vocab) == TEST_VOCAB_SIZE

def test_word_in_models(test_app, mock_corpus):
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
        corpus = load_corpus(mock_corpus)
        result = word_in_models(case['term'], corpus, 1)
        assert result == case['expected']

def test_description_import(mock_corpus):
    description = load_wm_documentation(mock_corpus)
    assert description == 'Description for testing.\n'

def test_query_transform(mock_corpus):
    corpus = load_corpus(mock_corpus)
    model = load_word_models(corpus)

    cases = [
        ('whale', 'whale'),
        ('Whale!', 'whale'),
        ('!?%)#', None),
        ('multiple words', None)
    ]

    for query, expected in cases:
        transformed = transform_query(query)
        assert transformed == expected
