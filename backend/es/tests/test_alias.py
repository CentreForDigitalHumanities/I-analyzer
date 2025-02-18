from addcorpus.models import Corpus
from es.es_alias import get_highest_version_number, create_alias_job
from es.es_index import perform_indexing


def test_alias(db, es_alias_client):
    corpus = Corpus.objects.get(name='times')
    assert corpus.configuration.es_index == 'test-times'
    job = create_alias_job(corpus)
    perform_indexing(job)
    res = es_alias_client.indices.get_alias(name=corpus.configuration.es_index)
    assert res.get('test-times-2') is not None


def test_alias_with_clean(es_alias_client):
    corpus = Corpus.objects.get(name='times')
    indices = es_alias_client.indices.get(
        index='{}-*'.format(corpus.configuration.es_index))
    assert 'test-times-1' in list(indices.keys())
    job = create_alias_job(corpus, True)
    perform_indexing(job)
    indices = es_alias_client.indices.get(
        index='{}-*'.format(corpus.configuration.es_index))
    assert 'test-times-1' not in list(indices.keys())


def test_highest_version_number(es_alias_client):
    corpus = Corpus.objects.get(name='times')
    indices = es_alias_client.indices.get(
        index='{}-*'.format(corpus.configuration.es_index))
    current_index = 'test-times'
    num = get_highest_version_number(indices, current_index)
    assert num == 2
    current_index = "fantasy-index-name"
    indices = es_alias_client.indices.get(index="{}-*".format(current_index))
    num = get_highest_version_number(indices, current_index)
    assert num == 0
