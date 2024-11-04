from time import sleep

from es.es_index import perform_indexing
from es.sync import update_server_table_from_settings, fetch_index_metadata
from es.models import Index, Server
from addcorpus.models import Corpus

def test_update_server_data(settings, db):
    update_server_table_from_settings()

    # test settings always include "default" server
    default_server = Server.objects.get(name='default')
    assert default_server.active

    # remove server from settings
    conf = settings.SERVERS.pop('default')
    update_server_table_from_settings()
    default_server.refresh_from_db()
    assert not default_server.active

    # add server to settings again
    settings.SERVERS['default'] = conf
    update_server_table_from_settings()
    default_server.refresh_from_db()
    assert default_server.active


def test_fetch_index_data(db, es_client, basic_mock_corpus, index_basic_mock_corpus):
    update_server_table_from_settings()
    fetch_index_metadata()

    corpus = Corpus.objects.get(name=basic_mock_corpus)
    index = Index.objects.get(server__name='default', name=corpus.configuration.es_index)
    assert index.available

    es_client.indices.delete(index=index.name)
    fetch_index_metadata()
    index.refresh_from_db()
    assert not index.available

    # restore index
    perform_indexing(corpus)
    sleep(1)

    fetch_index_metadata()
    index.refresh_from_db()
    assert index.available
