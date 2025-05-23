from django.core.management import call_command
import pytest
from elastic_transport import ConnectionError

from indexing.models import IndexJob

@pytest.fixture()
def no_elasticsearch_connection(settings):
    port = settings.SERVERS['default']['port']
    settings.SERVERS['default']['port'] = 999999

    yield

    settings.SERVERS['default']['port'] = port


def test_create_only(db, basic_mock_corpus, no_elasticsearch_connection):
    # indexing should fail...
    with pytest.raises(ConnectionError):
        call_command('index', basic_mock_corpus)
    IndexJob.objects.all().delete()

    # ...but --create-only should still succeed
    call_command('index', basic_mock_corpus, '--create-only')
    assert IndexJob.objects.get(corpus__name=basic_mock_corpus)

