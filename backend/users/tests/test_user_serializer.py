from addcorpus.models import Corpus


def test_user_serializer(auth_client,
                         auth_user,
                         user_credentials,
                         group_without_access,
                         group_with_access,
                         test_corpus):
    details = auth_client.get('/users/user/')
    assert details.status_code == 200
    assert details.data == {
        'id': 1,
        'username': user_credentials['username'],
        'email': user_credentials['email'],
        'download_limit': 10000,
        'corpora': [],
        'is_admin': False,
        'saml': False
    }

    # add a user group WITHOUT corpus permissions
    # corpora should remain unchanged
    auth_user.groups.add(group_without_access)
    auth_user.save()
    details = auth_client.get('/users/user/')
    assert details.data.get('corpora') == []

    # now add a user group WITH access
    # corpus should show up
    auth_user.groups.add(group_with_access)
    auth_user.save()
    details = auth_client.get('/users/user/')
    assert details.data.get('corpora') == ['test-corpus']


def test_admin_serializer(admin_client, admin_credentials, test_corpus):
    details = admin_client.get('/users/user/')
    assert details.status_code == 200
    assert details.data == {
        'id': 1,
        'username': admin_credentials['username'],
        'email': admin_credentials['email'],
        'download_limit': 10000,
        # admin should have access to all available corpora
        'corpora': ['test-corpus'],
        'is_admin': True,
        'saml': False

    }

    # create a corpus and try again: admin should have access to it
    Corpus.objects.create(name='Kuifje Collectie')
    details = admin_client.get('/users/user/')
    assert details.status_code == 200
    assert sorted(details.data.get('corpora')) == sorted(
        ['test-corpus', 'Kuifje Collectie'])
