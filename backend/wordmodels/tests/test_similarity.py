import numpy as np
import pytest

from addcorpus.load_corpus import load_corpus
import wordmodels.similarity as similarity
from wordmodels.visualisations import load_word_models
from copy import copy

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

    similarity1 = similarity.term_similarity(model, case['term'], case['similar_term'])
    assert type(similarity1) == float

    similarity2 = similarity.term_similarity(model, case['term'], case['less_similar'])

    assert similarity1 > similarity2

    similarity3 = similarity.term_similarity(model, case['term'], case['uppercase_term'])
    assert similarity1 == similarity3

def test_n_nearest_neighbours_amount(test_app, mock_corpus):

    for n in range(1, 16, 5):
        term = 'elizabeth'
        corpus = load_corpus(mock_corpus)
        binned_models = load_word_models(corpus, True)
        model = binned_models[0]

        result = similarity.find_n_most_similar(model, term, n)
        assert len(result) == n

@pytest.fixture
def model_with_term_removed(test_app, mock_corpus):
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

    other_term = 'elizabeth'

    # there SHOULD be a score for the original model...
    similarity_score = similarity.term_similarity(original_model, missing_term, other_term)
    assert similarity_score != None

    # ... but not with the adjusted vocab
    similarity_score = similarity.term_similarity(model, missing_term, other_term)
    assert similarity_score == None

    # term should be included in nearest neighbours with original model...
    similar_term = 'bingley'
    neighbours = similarity.find_n_most_similar(original_model, similar_term, 10)
    assert any([neighbour['key'] == missing_term for neighbour in neighbours])
    assert len(neighbours) == 10

    # ... but not with the adjusted vocab
    neighbours = similarity.find_n_most_similar(model, similar_term, 10)
    assert not any([neighbour['key'] == missing_term for neighbour in neighbours])
    assert len(neighbours) == 10
