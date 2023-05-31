import pytest
import os
from django.contrib.auth.models import Group
from addcorpus.load_corpus import load_all_corpora
from addcorpus.models import Corpus

@pytest.fixture()
def group_with_access(db, mock_corpus, mock_corpora_in_db):
    '''Create a group with access to the mock corpus'''
    group = Group.objects.create(name='nice-users')
    corpus = Corpus.objects.get(name=mock_corpus)
    corpus.groups.add(group)
    corpus.save()
    yield group
    group.delete()

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def mock_corpus(db):
    return 'mock-csv-corpus'

@pytest.fixture()
def mock_corpus_user(auth_user, group_with_access):
    auth_user.groups.add(group_with_access)
    auth_user.save()
    return auth_user
