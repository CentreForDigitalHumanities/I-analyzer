import pytest
from addcorpus.load_corpus import load_all_corpora

@pytest.fixture()
def mock_corpus(db):
    load_all_corpora()
    return 'tagging-mock-corpus'
