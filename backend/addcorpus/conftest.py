import pytest
import os
from django.contrib.auth.models import Group
from users.models import CustomUser
from addcorpus.load_corpus import load_all_corpora
from addcorpus.models import Corpus

@pytest.fixture()
def admin_group(db):
    group = Group.objects.create(name='admin')
    return group

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def mock_corpus_settings(settings):
    settings.CORPORA = {
        'mock-csv-corpus': os.path.join(here, 'tests', 'mock_csv_corpus.py')
    }

@pytest.fixture()
def mock_corpus(mock_corpus_settings):
    return 'mock-csv-corpus'

@pytest.fixture()
def mock_corpus_user(db, admin_group, mock_corpus):
    user = CustomUser.objects.create(username='mock-user', password='secret')
    user.groups.add(admin_group)
    user.save()
    load_all_corpora()
    corpus = Corpus.objects.get(name=mock_corpus)
    corpus.groups.add(admin_group)
    corpus.save()
    return user
