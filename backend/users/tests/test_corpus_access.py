from users.models import CustomUser
from addcorpus.permissions import can_search

def test_corpus_access(db, group_with_access, group_without_access, test_corpus):
    user = CustomUser.objects.create(username='test-user')
    assert not can_search(user, test_corpus)

    user.groups.add(group_without_access)
    user.save()
    assert not can_search(user, test_corpus)

    user.groups.add(group_with_access)
    user.save()
    assert can_search(user, test_corpus)
