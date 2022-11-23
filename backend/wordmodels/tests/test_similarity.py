import numpy as np
import pytest

from addcorpus.load_corpus import load_corpus
import wordmodels.similarity as similarity
from wordmodels.visualisations import load_word_models
from wordmodels.conftest import WM_MOCK_CORPORA
from copy import copy

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

@pytest.mark.parametrize("mock_corpus", WM_MOCK_CORPORA)
def test_term_similarity(test_app, mock_corpus):
    case = {
        'term': 'elizabeth',
        'similar_term': 'she',
        'less_similar': 'he',
        'uppercase_term': 'She'
    }
    corpus = load_corpus(mock_corpus)
    binned_models = load_word_models(corpus, True)
    model = binned_models[0]
    wm_type = corpus.word_model_type

    similarity1 = similarity.term_similarity(model, wm_type, case['term'], case['similar_term'])
    assert type(similarity1) == float

    similarity2 = similarity.term_similarity(model, wm_type, case['term'], case['less_similar'])

    assert similarity1 > similarity2

    similarity3 = similarity.term_similarity(model, wm_type, case['term'], case['uppercase_term'])
    assert similarity1 == similarity3

@pytest.mark.parametrize("mock_corpus", WM_MOCK_CORPORA)
def test_n_nearest_neighbours_amount(test_app, mock_corpus):

    for n in range(1, 16, 5):
        term = 'elizabeth'
        corpus = load_corpus(mock_corpus)
        binned_models = load_word_models(corpus, True)
        model = binned_models[0]
        wm_type = corpus.word_model_type

        result = similarity.find_n_most_similar(model, wm_type, term, n)
        assert len(result) == n

@pytest.fixture(params=WM_MOCK_CORPORA)
def model_with_term_removed(request, test_app):
    mock_corpus = request.param
    corpus = load_corpus(mock_corpus)
    binned_models = load_word_models(corpus, True)
    original_model = binned_models[0]
    model = copy(original_model)

    term = 'darcy'
    model['vocab'] = list(model['vocab']) # convert from np.array if needed
    model['vocab'].remove(term)

    return corpus, model, original_model, term


def test_vocab_is_subset_of_model(model_with_term_removed):
    '''Test cases where the vocab array is a subset of terms with vectors.'''

    corpus, model, original_model, missing_term = model_with_term_removed
    assert missing_term not in model['vocab']

    wm_type = corpus.word_model_type

    other_term = 'elizabeth'

    # there SHOULD be a score for the original model...
    similarity_score = similarity.term_similarity(original_model, wm_type, missing_term, other_term)
    assert similarity_score != None

    # ... but not with the adjusted vocab
    similarity_score = similarity.term_similarity(model, wm_type, missing_term, other_term)
    assert similarity_score == None

    # term should be included in nearest neighbours with original model...
    similar_term = 'bingley'
    neighbours = similarity.find_n_most_similar(original_model, wm_type, similar_term, 10)
    assert any([neighbour['key'] == missing_term for neighbour in neighbours])
    assert len(neighbours) == 10

    # ... but not with the adjusted vocab
    neighbours = similarity.find_n_most_similar(model, wm_type, similar_term, 10)
    assert not any([neighbour['key'] == missing_term for neighbour in neighbours])
    assert len(neighbours) == 10
