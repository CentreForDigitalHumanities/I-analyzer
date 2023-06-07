import pytest
from datetime import datetime
from time import sleep

from addcorpus.load_corpus import load_corpus
from es.es_index import perform_indexing
from ianalyzer import elasticsearch

start = datetime.strptime('1970-01-01','%Y-%m-%d')
end = datetime.strptime('1970-12-31','%Y-%m-%d')


def mock_client(es_index_client):
    return es_index_client


@pytest.mark.parametrize("prod, expected", [(True, "times-test-1"), (False, "times-test")])
def test_prod_flag(mock_corpus, es_index_client, corpus_definition, prod, expected):
    perform_indexing(
        mock_corpus, corpus_definition, start, end,
        mappings_only=True, add=False, clear=False, prod=prod, rollover=False)
    indices = es_index_client.indices.get(index='times-test*')
    assert expected in list(indices.keys())

@pytest.mark.parametrize("mappings_only, expected", [(False, 2), (True, 0)])
def test_mappings_only_flag(mock_corpus, es_index_client, corpus_definition, mappings_only, expected):
    perform_indexing(
        mock_corpus, corpus_definition, start, end,
        mappings_only=mappings_only, add=False, clear=False, prod=False, rollover=False)
    sleep(1)
    res = es_index_client.count(index='times-test*')
    assert res.get('count') == expected

def test_add_clear(mock_corpus, es_index_client, corpus_definition):
    perform_indexing(
        mock_corpus, corpus_definition, start, end,
        mappings_only=True, add=False, clear=False, prod=False, rollover=False
    )
    res = es_index_client.count(index='times-test*')
    assert res.get('count') == 0
    perform_indexing(
        mock_corpus, corpus_definition, start, end,
        mappings_only=False, add=True, clear=False, prod=False, rollover=False
    )
    sleep(1)
    res = es_index_client.count(index='times-test*')
    assert res.get('count') == 2
    perform_indexing(
        mock_corpus, corpus_definition, start, end,
        mappings_only=True, add=False, clear=True, prod=False, rollover=False
    )
    res = es_index_client.count(index='times-test*')
    assert res.get('count') == 0
