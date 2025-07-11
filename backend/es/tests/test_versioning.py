import pytest

from es.versioning import highest_version_in_result, version_from_name

@pytest.mark.parametrize(
    'name,version',
    [
        ('foo-1', 1),
        ('foo-11', 11),
        ('foo', None),
        ('foo-bar-3', None),
        ('foo-1-or-something', None),
    ]
)
def test_version_from_name(name, version):
    assert version_from_name(name, 'foo') == version


def test_highest_version_number(es_client, test_index_cleanup):
    base_name = 'test-versioning'

    es_client.indices.create(index='test-versioning-1')
    es_client.indices.create(index='test-versioning-2')

    result = es_client.indices.get(index='test-versioning*')
    assert highest_version_in_result(result, base_name) == 2

    assert highest_version_in_result(result, 'nonsense') == 0
