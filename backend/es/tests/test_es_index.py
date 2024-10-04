import pytest
from datetime import datetime
from time import sleep

from addcorpus.models import Corpus
from es.es_index import perform_indexing

START = datetime.strptime('1970-01-01', '%Y-%m-%d')
END = datetime.strptime('1970-12-31', '%Y-%m-%d')


def mock_client(es_index_client):
    return es_index_client


@pytest.mark.parametrize("prod, name, shards", [(True, "times-test-1", '5'), (False, "times-test", '1')])
def test_prod_flag(mock_corpus, es_index_client, corpus_definition, prod, name, shards):
    corpus = Corpus.objects.get(name=mock_corpus)
    perform_indexing(
        corpus, START, END,
        mappings_only=True, add=False, clear=False, prod=prod, rollover=False)

    assert es_index_client.indices.exists(index=name)
    assert es_index_client.indices.get_settings(index=name).get(
        name)['settings']['index']['number_of_shards'] == shards


@pytest.mark.parametrize("mappings_only, expected", [(False, 2), (True, 0)])
def test_mappings_only_flag(mock_corpus, es_index_client, corpus_definition, mappings_only, expected):
    corpus = Corpus.objects.get(name=mock_corpus)
    perform_indexing(
        corpus, START, END,
        mappings_only=mappings_only, add=False, clear=False, prod=False, rollover=False)
    sleep(1)
    res = es_index_client.count(index='times-test*')
    assert res.get('count') == expected


def test_add_clear(db, mock_corpus, es_index_client):
    corpus = Corpus.objects.get(name=mock_corpus)
    perform_indexing(
        corpus, START, END,
        mappings_only=True, add=False, clear=False, prod=False, rollover=False
    )
    res = es_index_client.count(index='times-test*')
    assert res.get('count') == 0
    perform_indexing(
        corpus, START, END,
        mappings_only=False, add=True, clear=False, prod=False, rollover=False
    )
    sleep(1)
    res = es_index_client.count(index='times-test*')
    assert res.get('count') == 2
    perform_indexing(
        corpus, START, END,
        mappings_only=True, add=False, clear=True, prod=False, rollover=False
    )
    res = es_index_client.count(index='times-test*')
    assert res.get('count') == 0


def test_mismatch_corpus_index_names(mock_corpus, corpus_definition, es_index_client):
    assert corpus_definition.es_index != mock_corpus


def test_db_only_corpus(json_mock_corpus, es_client, index_json_mock_corpus):
    res = es_client.count(index=json_mock_corpus.configuration.es_index)
    assert res.get('count') == 10


def test_indexing_with_version(mock_corpus, corpus_definition, es_index_client):
    corpus = Corpus.objects.get(name=mock_corpus)
    perform_indexing(
        corpus,
        START,
        END,
        mappings_only=False,
        add=False,
        clear=False,
        prod=True,
        rollover=True,
    )
    assert es_index_client.indices.exists(index="times-test-1") == True
