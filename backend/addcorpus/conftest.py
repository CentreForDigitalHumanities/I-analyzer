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

