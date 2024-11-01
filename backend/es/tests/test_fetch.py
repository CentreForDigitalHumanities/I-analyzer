from time import sleep

from es.es_index import perform_indexing
from es.fetch import fetch_index_data
from es.models import Index
from addcorpus.models import Corpus

def test_fetch_index_data(db, es_client, basic_mock_corpus, index_basic_mock_corpus):
    fetch_index_data()

    corpus = Corpus.objects.get(name=basic_mock_corpus)
    index = Index.objects.get(server='default', name=corpus.configuration.es_index)
    assert index.available

    es_client.indices.delete(index=index.name)
    fetch_index_data()
    index.refresh_from_db()
    assert not index.available

    # restore index
    perform_indexing(corpus)
    sleep(1)

    fetch_index_data()
    index.refresh_from_db()
    assert index.available
