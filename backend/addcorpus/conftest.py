import pytest
import os
from django.contrib.auth.models import Group
from addcorpus.models import Corpus

@pytest.fixture()
def group_with_access(db, mock_corpus):
    '''Create a group with access to the mock corpus'''
    group = Group.objects.create(name='nice-users')
    corpus = Corpus.objects.get(name=mock_corpus)
    corpus.groups.add(group)
    corpus.save()
    yield group
    group.delete()

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def mock_corpus():
    return 'mock-csv-corpus'
