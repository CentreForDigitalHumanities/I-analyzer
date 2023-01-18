import pytest
from django.contrib.auth.models import Group

@pytest.fixture()
def admin_group(db):
    Group.objects.create(name='admin')
