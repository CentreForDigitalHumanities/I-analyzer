from addcorpus.models import Corpus
from unittest.mock import ANY

def test_user_serializer(auth_client,
                         user_credentials):
    details = auth_client.get('/users/user/')
    assert details.status_code == 200
    assert details.data == {
        'id': ANY,
        'username': user_credentials['username'],
        'email': user_credentials['email'],
        'download_limit': 10000,
        'is_admin': False,
        'saml': False,
        'enable_search_history': True
    }


def test_admin_serializer(admin_client, admin_credentials):
    details = admin_client.get('/users/user/')
    assert details.status_code == 200
    assert details.data == {
        'id': ANY,
        'username': admin_credentials['username'],
        'email': admin_credentials['email'],
        'download_limit': 10000,
        'is_admin': True,
        'saml': False,
        'enable_search_history': True,
    }

def test_user_updates(auth_client):
    route = '/users/user/'
    details = lambda: auth_client.get(route)
    search_history_enabled = lambda: details().data.get('enable_search_history')

    assert search_history_enabled()

    response = auth_client.patch(route, {'enable_search_history': False}, content_type='application/json')
    assert response.status_code == 200

    assert not search_history_enabled()
