import pytest
from time import sleep
from django.contrib.auth.models import Group
import warnings
import os

from addcorpus.load_corpus import load_corpus, load_all_corpora
from ianalyzer.elasticsearch import elasticsearch
from es import es_index
from users.models import CustomUser
from addcorpus.models import Corpus

@pytest.fixture(scope='session')
def mock_corpus():
    return 'times'

@pytest.fixture()
def corpus_definition(mock_corpus):
    corpus = load_corpus(mock_corpus)
    yield corpus


@pytest.fixture(scope='module')
def es_forward_client(es_client, mock_corpus):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """

    # add data from mock corpus
    corpus = load_corpus(mock_corpus)
    es_index.create(es_client, corpus, False, True, False)
    es_index.populate(es_client, mock_corpus, corpus)

    es_client.index(index=corpus.es_index, document={'content': 'banana'})

    # ES is "near real time", so give it a second before we start searching the index
    sleep(1)
    yield es_client
    # delete index when done
    es_client.indices.delete(index='times-test')

@pytest.fixture()
def es_index_client(es_client, mock_corpus):
    """
    Returns an elastic search client for the mock corpus.
    After tests, removes any indices created for the mock corpus.
    """

    yield es_client
    # delete indices when done
    indices = es_client.indices.get(index='times-test*')
    for index in indices.keys():
        es_client.indices.delete(index=index)

@pytest.fixture()
def es_alias_client(es_client, mock_corpus):
    """
    Create multiple indices with version numbers for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    # add data from mock corpus
    corpus = load_corpus(mock_corpus)
    es_index.create(es_client, corpus, add=False, clear=True, prod=True) # create ianalyzer-times-1 index
    es_client.indices.create(index='times-test-2')
    es_client.indices.create(index='times-test-bla-3')

    yield es_client
    # delete index when done
    indices = es_client.indices.get(index='times-test*')
    for index in indices.keys():
        es_client.indices.delete(index=index)

@pytest.fixture()
def times_user(auth_user, mock_corpus):
    group = Group.objects.create(name='times-access')
    load_all_corpora()
    corpus = Corpus.objects.get(name=mock_corpus)
    corpus.groups.add(group)
    corpus.save()
    auth_user.groups.add(group)
    auth_user.save()
    yield auth_user
    group.delete()
