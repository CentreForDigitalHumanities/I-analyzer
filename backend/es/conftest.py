import pytest
from time import sleep

from django.contrib.auth.models import Group
import elasticsearch

from addcorpus.python_corpora.load_corpus import load_corpus_definition
from addcorpus.models import Corpus


@pytest.fixture(scope='session')
def mock_corpus():
    return 'times'


@pytest.fixture()
def corpus_definition(mock_corpus):
    corpus = load_corpus_definition(mock_corpus)
    yield corpus


@pytest.fixture()
def es_ner_search_client(es_client, basic_mock_corpus, basic_corpus_public, index_basic_mock_corpus):
    """
    Create and populate an index for the mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    # add data from mock corpus
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    try:
        es_client.indices.put_mapping(index=corpus.configuration.es_index, properties={
                                    "content:ner": {"type": "annotated_text"}})
    except elasticsearch.BadRequestError:
        pytest.skip('Annotated text plugin not installed')

    es_client.index(index=corpus.configuration.es_index, document={
        'id': 'my_identifier',
        'content': 'Guybrush Threepwood is looking for treasure on Monkey Island',
        'content:ner': '[Guybrush Threepwood](PER) is looking for treasure on [Monkey Island](LOC)'})

    # ES is "near real time", so give it a second before we start searching the index
    sleep(1)
    yield es_client


@pytest.fixture()
def small_mock_corpus_user(auth_user, small_mock_corpus):
    group = Group.objects.create(name='corpus access')
    corpus = Corpus.objects.get(name=small_mock_corpus)
    corpus.groups.add(group)
    corpus.save()
    auth_user.groups.add(group)
    auth_user.save()
    return auth_user
