import pytest
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


@pytest.fixture()
def another_group_with_access(db, basic_mock_corpus, small_mock_corpus):
    '''Create another group with access to the mock corpus, and an additional corpus'''
    group = Group.objects.create(name='not-nice-users')
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    small_mock_corpus = Corpus.objects.get(name=small_mock_corpus)
    corpus.groups.add(group)
    small_mock_corpus.groups.add(group)
    corpus.save()
    small_mock_corpus.save()
    yield group
    group.delete()
