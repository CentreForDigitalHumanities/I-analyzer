import pytest
import os
from django.conf import settings
from users.models import CustomUser
from addcorpus.load_corpus import load_all_corpora
from addcorpus.models import Corpus

here = os.path.abspath(os.path.dirname(__file__))

TEST_VOCAB_SIZE = 200
TEST_DIMENSIONS = 20
TEST_BINS = [(1810, 1839), (1840, 1869), (1870, 1899)]


@pytest.fixture()
def mock_corpus():
    return 'wordmodels-mock-corpus'
