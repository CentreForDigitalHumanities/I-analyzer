import pytest
from addcorpus.load_corpus import load_all_corpora

@pytest.fixture()
def mock_corpus():
    return 'media-mock-corpus'
