from users.models import CustomUser

def test_access_through_group(mock_corpus, mock_corpus_group):
    user = CustomUser.objects.create(username='nice-user', password='secret')
    user.groups.add(mock_corpus_group)
    user.save()
    assert user.has_access(mock_corpus)

def test_superuser_access(mock_corpus, mock_corpus_group):
    user = CustomUser.objects.create(username='super-user', password='secret', is_superuser=True)
    assert user.has_access(mock_corpus)

def test_no_corpus_access(mock_corpus, mock_corpus_group):
    user = CustomUser.objects.create(username='bad-user', password='secret')
    assert not user.has_access(mock_corpus)


def test_api_access(mock_corpus, mock_corpus_group, auth_client, auth_user):
    # default: no access
    response = auth_client.get('/api/corpus/')
    assert len(response.data) == 0

    # after adding group, access should be granted
    auth_user.groups.add(mock_corpus_group)
    auth_user.save
    response = auth_client.get('/api/corpus/')
    assert len(response.data) == 1
    assert response.data[0].get('name') == 'mock-csv-corpus'
