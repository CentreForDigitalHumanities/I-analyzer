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

_here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def times_test_settings(settings):
    settings.CORPORA = {
        'times': os.path.join(_here, '../corpora/times/times.py')
    }

    settings.TIMES_DATA = os.path.join(_here, '../addcorpus/tests')
    settings.TIMES_ES_INDEX = 'ianalyzer-test-times'
    settings.TIMES_SCAN_IMAGE_TYPE = 'image/png'

CORPUS_NAME = 'times'

@pytest.fixture()
def corpus_definition(times_test_settings):
    corpus = load_corpus(CORPUS_NAME)
    yield corpus


@pytest.fixture()
def es_forward_client(times_test_settings):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch(CORPUS_NAME)
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    # add data from mock corpus
    corpus = load_corpus(CORPUS_NAME)
    es_index.create(client, corpus, False, True, False)
    es_index.populate(client, CORPUS_NAME, corpus)

    client.index(index=corpus.es_index, document={'content': 'banana'})

    # ES is "near real time", so give it a second before we start searching the index
    sleep(1)
    yield client
    # delete index when done
    client.indices.delete(index='ianalyzer-test-times')

@pytest.fixture()
def es_index_client(times_test_settings):
    """
    Create an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch('times')
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    yield client
    # delete indices when done
    indices = client.indices.get(index='ianalyzer-test*')
    for index in indices.keys():
        client.indices.delete(index=index)

@pytest.fixture()
def es_alias_client(times_test_settings):
    """
    Create multiple indices with version numbers for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    client = elasticsearch('times')
    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    # add data from mock corpus
    corpus = load_corpus('times')
    es_index.create(client, corpus, add=False, clear=True, prod=True) # create ianalyzer-times-1 index
    client.indices.create(index='ianalyzer-test-times-2')
    client.indices.create(index='ianalyzer-test-times-bla-3')

    yield client
    # delete index when done
    indices = client.indices.get(index='ianalyzer-test*')
    for index in indices.keys():
        client.indices.delete(index=index)

@pytest.fixture()
def times_user(db):
    username = 'times-user'
    password = 'secret'
    group = Group.objects.create(name='times-access')
    user = CustomUser.objects.create(username=username, password=password)
    load_all_corpora()
    corpus = Corpus.objects.get(name='times')
    corpus.groups.add(group)
    corpus.save()
    user.groups.add(group)
    user.save()
    return user
