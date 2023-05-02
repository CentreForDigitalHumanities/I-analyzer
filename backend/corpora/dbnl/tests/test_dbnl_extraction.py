import pytest
import os

from addcorpus.load_corpus import load_corpus

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture
def dbnl_corpus(settings):
    settings.DBNL_DATA = os.path.join(here, 'data')
    settings.CORPORA = {
        'dbnl': os.path.join(here, '..', 'dbnl.py')
    }
    return 'dbnl'

expected_docs = [
    {
        'title': 'Het singende nachtegaeltje',
        'author': 'Cornelis Maertsz.'
    }
]

def test_dbnl_extraction(dbnl_corpus):
    corpus = load_corpus(dbnl_corpus)
    docs = corpus.documents()

    for actual, expected in zip(docs, expected_docs):
        assert actual == expected
