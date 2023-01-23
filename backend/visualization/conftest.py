from users.models import CustomUser
import pytest

@pytest.fixture()
def corpus_user(db):
    '''Make a user with access to the mock corpora'''

    username = 'mock-user'
    password = 'secret'
    user = CustomUser.objects.create(username=username, password=password)
    return user

@pytest.fixture()
def authenticated_client(client, corpus_user):
    client.force_login(corpus_user)
    return client
