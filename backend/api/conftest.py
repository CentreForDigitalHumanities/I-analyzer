import pytest
from users.models import CustomUser

@pytest.fixture()
def user_credentials(db):
    username = 'user'
    password = 'secret'
    CustomUser.objects.create(username=username, password=password)
    return {'username': username, 'password': password}
