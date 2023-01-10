import pytest

from es.es_alias import alias, get_highest_version_number
from es.es_index import create
from addcorpus.load_corpus import load_corpus


def test_alias(test_app, es_alias_client):
    corpus_definition = load_corpus('times')
    assert corpus_definition.es_index == 'ianalyzer-test-times'
    alias('times', corpus_definition) # create an alias ianalyzer-times
    res = es_alias_client.indices.get_alias(name=corpus_definition.es_index)
    assert res.get('ianalyzer-test-times-2') is not None

def test_alias_with_clean(test_app, es_alias_client):
    corpus_definition = load_corpus('times')
    indices = es_alias_client.indices.get(index='{}-*'.format(corpus_definition.es_index))
    assert 'ianalyzer-test-times-1' in list(indices.keys())
    alias('times', corpus_definition, True)
    indices = es_alias_client.indices.get(index='{}-*'.format(corpus_definition.es_index))
    assert 'ianalyzer-test-times-1' not in list(indices.keys())

def test_highest_version_number(test_app, es_alias_client):
    corpus_definition = load_corpus('times')
    indices = es_alias_client.indices.get(index='{}-*'.format(corpus_definition.es_index))
    current_index = 'ianalyzer-test-times'
    num = get_highest_version_number(indices, current_index)
    assert num == 2










