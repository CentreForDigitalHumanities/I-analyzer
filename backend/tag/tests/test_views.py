from rest_framework import status
from tag.models import Tag
from visualization.query import MATCH_ALL
from es.search import hits


def n_tags():
    return Tag.objects.all().count()


def test_read(auth_client, auth_user_tag, admin_user_tag):
    # List (only your own) Tags
    resp = auth_client.get('/api/tag/tags/')
    assert resp.status_code == status.HTTP_200_OK
    assert n_tags() == 2
    assert len(resp.data) == 1
    assert resp.data[0].get('id') == auth_user_tag.id

    # Get your own Tag
    resp = auth_client.get(f'/api/tag/tags/{auth_user_tag.id}/')
    assert resp.status_code == status.HTTP_200_OK

    # Don't allow GET non-owned Tag
    resp = auth_client.get(f'/api/tag/tags/{admin_user_tag.id}/')
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_create(auth_client, auth_user_tag):
    assert n_tags() == 1
    new_tag = {'name': 'New tag', 'description': 'New description'}
    resp = auth_client.post('/api/tag/tags/', new_tag)
    assert resp.status_code == status.HTTP_201_CREATED
    assert n_tags() == 2


def test_update(auth_client, auth_user_tag):
    resp = auth_client.patch(f'/api/tag/tags/{auth_user_tag.id}/',
                             {'name': 'New name'},
                             content_type='application/json')
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data.get('name') == 'New name'


def test_delete(auth_client, auth_user_tag, admin_user_tag):
    assert n_tags() == 2
    resp = auth_client.delete(f'/api/tag/tags/{auth_user_tag.id}/')
    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert n_tags() == 1

    # Don't allow DELETE non-owned
    resp = auth_client.delete(f'/api/tag/tags/{admin_user_tag.id}/')
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_admin_delete(admin_client, auth_user_tag):
    assert n_tags() == 1
    resp = admin_client.delete(f'/api/tag/tags/{auth_user_tag.id}/')
    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert n_tags() == 0

def test_list_corpus_tags(auth_client, auth_user_tag, tagged_documents, mock_corpus, other_corpus):
    response = auth_client.get(f'/api/tag/tags/?corpus={mock_corpus}')
    assert status.is_success(response.status_code)
    assert len(response.data) == 1

    tag = response.data[0]
    assert tag.get('count') == 3

    empty_response = auth_client.get(f'/api/tag/tags/?corpus={other_corpus}')
    assert status.is_success(empty_response.status_code)
    assert len(empty_response.data) == 0

    not_found = auth_client.get('/api/tag/tags/?corpus=nonexistent')
    assert not_found.status_code == status.HTTP_404_NOT_FOUND

def test_get_document_tags(auth_user, auth_client, auth_user_tag, tagged_documents, mock_corpus):
    doc_id = tagged_documents[1][0]
    response = auth_client.get(f'/api/tag/document_tags/{mock_corpus}/{doc_id}')
    assert status.is_success(response.status_code)

def test_patch_document_tags(auth_client, auth_user_tag, mock_corpus, auth_user_corpus_acces):
    assert auth_user_tag.count == 0

    new_doc = 'a-new-document'
    patch_request = lambda data: auth_client.patch(
        f'/api/tag/document_tags/{mock_corpus}/{new_doc}',
        data,
        content_type='application/json'
    )

    response = patch_request([
        { 'op': 'add', 'value': auth_user_tag.id }
    ])

    assert status.is_success(response.status_code)
    assert auth_user_tag.count == 1

    response = patch_request([
        { 'op': 'remove', 'value': auth_user_tag.id }
    ])

    assert status.is_success(response.status_code)
    assert auth_user_tag.count == 0

def search_with_tag(client, corpus_name, tag_id):
    route = f'/api/es/{corpus_name}/_search'
    query = MATCH_ALL
    tag_data = {'tags': [tag_id]}
    data = {**query, **tag_data}
    return client.post(route, data, content_type = 'application/json')

def test_search_view_with_tag(auth_client, mock_corpus, auth_user_tag, tagged_documents, index_mock_corpus):
    response = search_with_tag(auth_client, mock_corpus, auth_user_tag.id)
    assert status.is_success(response.status_code)
    assert len(hits(response.data)) == auth_user_tag.count

def test_search_view_unauthorized_tag(auth_client, mock_corpus, admin_user_tag, auth_user_corpus_acces):
    response = search_with_tag(auth_client, mock_corpus, admin_user_tag.id)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_search_view_nonexistent_tag(auth_client, mock_corpus, auth_user_corpus_acces):
    not_a_real_tag = 12345678
    response = search_with_tag(auth_client, mock_corpus, not_a_real_tag)
    assert response.status_code == status.HTTP_404_NOT_FOUND

