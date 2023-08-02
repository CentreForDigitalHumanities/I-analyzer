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
        'saml': False
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
        'saml': False

    }
