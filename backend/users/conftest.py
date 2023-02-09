import pytest
from django.contrib.auth.models import Group
from addcorpus.models import Corpus


@pytest.fixture
def group_with_access():
    nice = Group.objects.create(name='nice-users')
    yield nice
    nice.delete()


@pytest.fixture
def group_without_access():
    naughty = Group.objects.create(name='naughty-users')
    yield naughty
    naughty.delete()


@pytest.fixture
def test_corpus(group_with_access):
    corpus = Corpus.objects.create(name='test-corpus')
    corpus.groups.add(group_with_access)
    corpus.save()
    yield corpus
