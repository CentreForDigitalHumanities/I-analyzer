from wordmodels.visualisations import load_word_models
from wordmodels.conftest import TEST_VOCAB_SIZE, TEST_DIMENSIONS, TEST_BINS
from wordmodels.utils import load_wm_documentation

def test_complete_import(test_app):
    filename = test_app.config['WM_COMPLETE_FN']
    model = load_word_models('mock-corpus', filename)
    assert model

    weights = model['svd_ppmi']
    assert weights.shape == (TEST_DIMENSIONS, TEST_VOCAB_SIZE)

    transformer = model['transformer']
    assert transformer.max_features == TEST_VOCAB_SIZE

def test_binned_import(test_app):
    filename = test_app.config['WM_BINNED_FN']
    models = load_word_models('mock-corpus', filename)
    assert len(models) == len(TEST_BINS)

    for model, bin in zip(models, TEST_BINS):
        start_year, end_year = bin

        assert model['start_year'] == start_year
        assert model['end_year'] == end_year

        weights = model['svd_ppmi']
        assert weights.shape == (TEST_DIMENSIONS, TEST_VOCAB_SIZE)

        transformer = model['transformer']
        assert transformer.max_features == TEST_VOCAB_SIZE

def test_description_import(test_app):
    description = load_wm_documentation('mock-corpus')
    assert description == 'Description for testing.\n'
