import pytest

from es.es_alias import alias, get_highest_version_number
from es.es_index import create
from addcorpus.load_corpus import load_corpus


def test_alias(es_alias_client):
    corpus_definition = load_corpus('times')
    assert corpus_definition.es_index == 'times-test'
    alias('times', corpus_definition) # create an alias ianalyzer-times
    res = es_alias_client.indices.get_alias(name=corpus_definition.es_index)
    assert res.get('times-test-2') is not None

def test_alias_with_clean(es_alias_client):
    corpus_definition = load_corpus('times')
    indices = es_alias_client.indices.get(index='{}-*'.format(corpus_definition.es_index))
    assert 'times-test-1' in list(indices.keys())
    alias('times', corpus_definition, True)
    indices = es_alias_client.indices.get(index='{}-*'.format(corpus_definition.es_index))
    assert 'times-test-1' not in list(indices.keys())

def test_highest_version_number(es_alias_client):
    corpus_definition = load_corpus('times')
    indices = es_alias_client.indices.get(index='{}-*'.format(corpus_definition.es_index))
    current_index = 'times-test'
    num = get_highest_version_number(indices, current_index)
    assert num == 2










