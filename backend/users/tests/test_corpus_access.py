from users.models import CustomUser


def test_corpus_access(db, group_with_access, group_without_access, test_corpus):
    user = CustomUser.objects.create(username='test-user')
    assert not user.searchable_corpora().contains(test_corpus)

    user.groups.add(group_without_access)
    user.save()
    assert not user.searchable_corpora().contains(test_corpus)

    user.groups.add(group_with_access)
    user.save()
    assert user.searchable_corpora().contains(test_corpus)
