import pytest
import os
from django.contrib.auth.models import Group
from addcorpus.models import Corpus

@pytest.fixture()
def group_with_access(db, basic_mock_corpus):
    '''Create a group with access to the mock corpus'''
    group = Group.objects.create(name='nice-users')
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    corpus.groups.add(group)
    corpus.save()
    yield group
    group.delete()

here = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture()
def basic_corpus():
    corpus_name = 'mock-basic-corpus'
    basic_group = Group.objects.create(name='basic')
    corpus = Corpus.objects.get(name=corpus_name)
    corpus.groups.add(basic_group)
    yield corpus_name
    corpus.groups.remove(basic_group)
    basic_group.delete()
