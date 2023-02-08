import pytest
import os
from django.contrib.auth.models import Group
from users.models import CustomUser
from addcorpus.load_corpus import load_all_corpora
from addcorpus.models import Corpus

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def mock_corpus_settings(settings):
    settings.CORPORA = {
        'media-mock-corpus': os.path.join(here, 'tests', 'media_mock_corpus.py')
    }

@pytest.fixture()
def mock_corpus(mock_corpus_settings):
    return 'media-mock-corpus'

@pytest.fixture()
def mock_corpus_user(db):
    user = CustomUser.objects.create(username='mock-user', password='secret', is_superuser=True)
    load_all_corpora()
    return user
