from rest_framework import status
from tag.models import Tag


def n_tags():
    return Tag.objects.all().count()


def test_read(auth_client, auth_user_tag, admin_user_tag):
    # List (only your own) Tags
    resp = auth_client.get('/api/tags/')
    assert resp.status_code == status.HTTP_200_OK
    assert n_tags() == 2
    assert len(resp.data) == 1
    assert resp.data[0].get('id') == auth_user_tag.id

    # Get your own Tag
    resp = auth_client.get(f'/api/tags/{auth_user_tag.id}/')
    assert resp.status_code == status.HTTP_200_OK

    # Don't allow GET non-owned Tag
    resp = auth_client.get(f'/api/tags/{admin_user_tag.id}/')
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_create(auth_client, auth_user_tag):
    assert n_tags() == 1
    new_tag = {'name': 'New tag', 'description': 'New description'}
    resp = auth_client.post('/api/tags/', new_tag)
    assert resp.status_code == status.HTTP_201_CREATED
    assert n_tags() == 2


def test_update(auth_client, auth_user_tag):
    resp = auth_client.patch(f'/api/tags/{auth_user_tag.id}/',
                             {'name': 'New name'},
                             content_type='application/json')
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data.get('name') == 'New name'


def test_delete(auth_client, auth_user_tag, admin_user_tag):
    assert n_tags() == 2
    resp = auth_client.delete(f'/api/tags/{auth_user_tag.id}/')
    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert n_tags() == 1

    # Don't allow DELETE non-owned
    resp = auth_client.delete(f'/api/tags/{admin_user_tag.id}/')
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_admin_delete(admin_client, auth_user_tag):
    assert n_tags() == 1
    resp = admin_client.delete(f'/api/tags/{auth_user_tag.id}/')
    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert n_tags() == 0
