from users.models import CustomUser
from addcorpus.models import Corpus
from django.contrib.auth.models import Group

def test_corpus_access(db):
    group_with_access = Group.objects.create(name='nice-users')
    group_without_access = Group.objects.create(name='naughty-users')

    corpus = Corpus.objects.create(name='test-corpus')
    corpus.groups.add(group_with_access)
    corpus.save()

    user = CustomUser.objects.create(username='test-user')

    assert not user.has_access('test-corpus')

    user.groups.add(group_without_access)
    user.save()
    assert not user.has_access('test-corpus')

    user.groups.add(group_with_access)
    user.save()
    assert user.has_access('test-corpus')
