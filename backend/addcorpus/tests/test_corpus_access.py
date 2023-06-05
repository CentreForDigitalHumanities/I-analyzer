from users.models import CustomUser

def test_access_through_group(db, mock_corpus, group_with_access):
    user = CustomUser.objects.create(username='nice-user', password='secret')
    user.groups.add(group_with_access)
    user.save()
    assert user.has_access(mock_corpus)

def test_superuser_access(mock_corpus, admin_user):
    assert admin_user.has_access(mock_corpus)

def test_no_corpus_access(db, mock_corpus):
    user = CustomUser.objects.create(username='bad-user', password='secret')
    assert not user.has_access(mock_corpus)

def test_api_access(db, mock_corpus, group_with_access, auth_client, auth_user):
    # default: no access
    response = auth_client.get('/api/corpus/')
    assert len(response.data) == 0

    # after adding group, access should be granted
    auth_user.groups.add(group_with_access)
    auth_user.save
    response = auth_client.get('/api/corpus/')
    assert len(response.data) == 1
    assert response.data[0].get('name') == mock_corpus

def test_superuser_api_access(admin_client, mock_corpus):
    response = admin_client.get('/api/corpus/')
    assert response.status_code == 200
    assert any(corpus['name'] == mock_corpus for corpus in response.data)
