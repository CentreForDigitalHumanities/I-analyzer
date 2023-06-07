import pytest
from addcorpus.models import Corpus

@pytest.fixture()
def mock_corpus(db):
    name = 'mock-corpus'
    Corpus.objects.create(name=name)
    return name
