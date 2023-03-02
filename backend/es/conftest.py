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

@pytest.fixture
def mock_corpus():
    return 'times'

@pytest.fixture()
def corpus_definition(mock_corpus):
    corpus = load_corpus(mock_corpus)
    yield corpus


@pytest.fixture()
def es_forward_client(mock_corpus):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch(mock_corpus)
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    # add data from mock corpus
    corpus = load_corpus(mock_corpus)
    es_index.create(client, corpus, False, True, False)
    es_index.populate(client, mock_corpus, corpus)

    client.index(index=corpus.es_index, document={'content': 'banana'})

    # ES is "near real time", so give it a second before we start searching the index
    sleep(1)
    yield client
    # delete index when done
    client.indices.delete(index='times-test')

@pytest.fixture()
def es_index_client(mock_corpus):
    """
    Create an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch(mock_corpus)
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    yield client
    # delete indices when done
    indices = client.indices.get(index='times-test*')
    for index in indices.keys():
        client.indices.delete(index=index)

@pytest.fixture()
def es_alias_client(mock_corpus):
    """
    Create multiple indices with version numbers for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch(mock_corpus)
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    # add data from mock corpus
    corpus = load_corpus(mock_corpus)
    es_index.create(client, corpus, add=False, clear=True, prod=True) # create ianalyzer-times-1 index
    client.indices.create(index='times-test-2')
    client.indices.create(index='times-test-bla-3')

    yield client
    # delete index when done
    indices = client.indices.get(index='times-test*')
    for index in indices.keys():
        client.indices.delete(index=index)

@pytest.fixture()
def times_user(db, mock_corpus):
    username = 'times-user'
    password = 'secret'
    group = Group.objects.create(name='times-access')
    user = CustomUser.objects.create(username=username, password=password)
    load_all_corpora()
    corpus = Corpus.objects.get(name=mock_corpus)
    corpus.groups.add(group)
    corpus.save()
    user.groups.add(group)
    user.save()
    return user
