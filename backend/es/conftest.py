import pytest
from django.contrib.auth.models import Group

from addcorpus.python_corpora.load_corpus import load_corpus_definition
from addcorpus.models import Corpus
from es import es_index


@pytest.fixture(scope='session')
def mock_corpus():
    return 'times'


@pytest.fixture()
def corpus_definition(mock_corpus):
    corpus = load_corpus_definition(mock_corpus)
    yield corpus


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
    corpus = Corpus.objects.get(name=mock_corpus)
    es_index.create(es_client, corpus, add=False, clear=True, prod=True) # create ianalyzer-times-1 index
    es_client.indices.create(index='times-test-2')
    es_client.indices.create(index='times-test-bla-3')

    yield es_client
    # delete index when done
    indices = es_client.indices.get(index='times-test*')
    for index in indices.keys():
        es_client.indices.delete(index=index)


@pytest.fixture()
def small_mock_corpus_user(auth_user, small_mock_corpus):
    group = Group.objects.create(name='corpus access')
    corpus = Corpus.objects.get(name=small_mock_corpus)
    corpus.groups.add(group)
    corpus.save()
    auth_user.groups.add(group)
    auth_user.save()
    return auth_user
