import pytest
from django.contrib.auth.models import Group
from addcorpus.models import Corpus

@pytest.fixture
def user_credentials():
    return {'username': 'basic_user',
            'password': 'basic_user',
            'email': 'basicuser@ianalyzer.com'}


@pytest.fixture
def admin_credentials():
    return {'username': 'admin',
            'password': 'admin',
            'email': 'admin@ianalyzer.com'}


@pytest.fixture
def auth_user(django_user_model, user_credentials):
    user = django_user_model.objects.create_user(
        username=user_credentials['username'],
        password=user_credentials['password'],
        email=user_credentials['email'])
    yield user
    user.delete()


@pytest.fixture
def auth_client(client, auth_user, user_credentials):
    client.login(
        username=user_credentials['username'],
        password=user_credentials['password'])
    yield client
    client.logout()


@pytest.fixture
def admin_user(django_user_model, admin_credentials):
    user = django_user_model.objects.create_superuser(
        username=admin_credentials['username'],
        password=admin_credentials['password'],
        email=admin_credentials['email'])
    yield user
    user.delete()


@pytest.fixture
def admin_client(client, admin_user, admin_credentials):
    client.login(
        username=admin_credentials['username'],
        password=admin_credentials['password'])
    yield client
    client.logout()


@pytest.fixture
def group_with_access():
    nice = Group.objects.create(name='nice-users')
    yield nice
    nice.delete()


@pytest.fixture
def group_without_access():
    naughty = Group.objects.create(name='naughty-users')
    yield naughty
    naughty.delete()


@pytest.fixture
def test_corpus(group_with_access):
    corpus = Corpus.objects.create(name='test-corpus')
    corpus.groups.add(group_with_access)
    corpus.save()
    yield corpus
