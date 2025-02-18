import json
from time import sleep
import os
import pytest
import requests
from allauth.account.models import EmailAddress
from elasticsearch import Elasticsearch
import warnings

from ianalyzer.elasticsearch import client_from_config
from addcorpus.python_corpora.save_corpus import load_and_save_all_corpora
from es import sync
from indexing.create_job import create_indexing_job
from indexing.run_job import perform_indexing
from django.conf import settings
from django.contrib.auth.models import Group
from addcorpus.models import Corpus
from addcorpus.serializers import CorpusJSONDefinitionSerializer
from es.models import Server

@pytest.fixture(autouse=True)
def media_dir(tmpdir, settings):
    settings.MEDIA_ROOT = tmpdir

# user credentials and logged-in api clients
@pytest.fixture
def user_credentials():
    return {'username': 'basic_user',
            'password': 'basic_user',
            'email': 'basicuser@ianalyzer.com'}


@pytest.fixture
def admin_credentials():
    return {'username': 'admin',
            'password': 'admin',
            'email': 'admin@ianalyzer.com'}


@pytest.fixture
def auth_user(django_user_model, user_credentials):
    user = django_user_model.objects.create_user(
        username=user_credentials['username'],
        password=user_credentials['password'],
        email=user_credentials['email'])
    EmailAddress.objects.create(user=user,
                                email=user.email,
                                verified=True,
                                primary=True)
    return user


@pytest.fixture
def auth_client(client, auth_user, user_credentials):
    client.login(
        username=user_credentials['username'],
        password=user_credentials['password'])
    yield client
    client.logout()


@pytest.fixture
def admin_user(django_user_model, admin_credentials):
    user = django_user_model.objects.create_superuser(
        username=admin_credentials['username'],
        password=admin_credentials['password'],
        email=admin_credentials['email'],
        download_limit=1000000)
    return user


@pytest.fixture
def admin_client(client, admin_user, admin_credentials):
    client.login(
        username=admin_credentials['username'],
        password=admin_credentials['password'])
    yield client
    client.logout()

@pytest.fixture()
def basic_corpus_public(db, basic_mock_corpus):
    basic_group = Group.objects.create(name='basic')
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    corpus.groups.add(basic_group)
    yield basic_mock_corpus
    corpus.groups.remove(basic_group)
    basic_group.delete()


@pytest.fixture(scope='session')
def connected_to_internet():
    """
    Check if there is internet connection. Skip if no connection can be made.
    """
    try:
        requests.get("https://1.1.1.1")
    except:
        pytest.skip('Cannot connect to internet')


# elasticsearch
@pytest.fixture(scope='session')
def es_client():
    """
    Initialise an elasticsearch client for the default elasticsearch cluster. Skip if no connection can be made.
    """

    client = client_from_config(settings.SERVERS['default'])

    # check if client is available, else skip test
    try:
        client.info()
    except:
        pytest.skip('Cannot connect to elasticsearch server')

    return client


@pytest.fixture()
def es_server(db, settings) -> Server:
    sync.update_server_table_from_settings()
    return Server.objects.get(name='default')


@pytest.fixture()
def basic_mock_corpus() -> str:
    return 'mock-csv-corpus'

@pytest.fixture()
def small_mock_corpus() -> str:
    return 'small-mock-corpus'


@pytest.fixture()
def large_mock_corpus() -> str:
    return 'large-mock-corpus'


@pytest.fixture()
def ml_mock_corpus() -> str:
    return 'multilingual-mock-corpus'

@pytest.fixture()
def media_mock_corpus() -> str:
    return 'media-mock-corpus'


@pytest.fixture()
def tag_mock_corpus() -> str:
    return 'tagging-mock-corpus'

def _clear_test_indices(es_client: Elasticsearch):
    response = es_client.indices.get(index='test-*')
    for index in response.keys():
        es_client.indices.delete(index=index)


@pytest.fixture(scope='session')
def test_index_cleanup(es_client: Elasticsearch):
    _clear_test_indices(es_client)
    yield
    _clear_test_indices(es_client)


def _index_test_corpus(es_client: Elasticsearch, corpus_name: str):
    corpus = Corpus.objects.get(name=corpus_name)

    if not es_client.indices.exists(index=corpus.configuration.es_index):
        with warnings.catch_warnings():
            job = create_indexing_job(corpus)
            perform_indexing(job)

        # ES is "near real time", so give it a second before we start searching the index
        sleep(2)

@pytest.fixture()
def index_basic_mock_corpus(db, es_client: Elasticsearch, basic_mock_corpus: str, test_index_cleanup):
    _index_test_corpus(es_client, basic_mock_corpus)


@pytest.fixture()
def index_small_mock_corpus(db, es_client: Elasticsearch, small_mock_corpus: str, test_index_cleanup):
    _index_test_corpus(es_client, small_mock_corpus)


@pytest.fixture()
def index_large_mock_corpus(db, es_client: Elasticsearch, large_mock_corpus: str, test_index_cleanup):
    _index_test_corpus(es_client, large_mock_corpus)


@pytest.fixture()
def index_ml_mock_corpus(db, es_client: Elasticsearch, ml_mock_corpus: str, test_index_cleanup):
    _index_test_corpus(es_client, ml_mock_corpus)


@pytest.fixture()
def index_tag_mock_corpus(db, es_client: Elasticsearch, tag_mock_corpus: str, test_index_cleanup):
    _index_test_corpus(es_client, tag_mock_corpus)


@pytest.fixture()
def index_json_mock_corpus(db, es_client: Elasticsearch, json_mock_corpus: Corpus, test_index_cleanup):
    _index_test_corpus(es_client, json_mock_corpus.name)


# mock corpora
@pytest.fixture(autouse=True)
def add_mock_python_corpora_to_db(db, media_dir):
    # add python mock corpora to the database at the start of each test
    with warnings.catch_warnings():
        warnings.filterwarnings('ignore', message="Corpus has no 'id' field")
        warnings.filterwarnings(
            'ignore', message='.* text search for keyword fields without text analysis'
        )
        load_and_save_all_corpora()


@pytest.fixture()
def json_corpus_definition():
    path = os.path.join(settings.BASE_DIR, 'corpora_test', 'basic', 'mock_corpus.json')
    with open(path) as f:
        return json.load(f)


@pytest.fixture(autouse=True)
def json_mock_corpus(db, json_corpus_definition) -> Corpus:
    # add json mock corpora to the database at the start of each test
    data = {
        'definition': json_corpus_definition,
        'active': True,
    }
    serializer = CorpusJSONDefinitionSerializer(data=data)
    assert serializer.is_valid()
    corpus = serializer.create(serializer.validated_data)

    data_dir = os.path.join(settings.BASE_DIR, 'corpora_test', 'basic', 'source_data')
    corpus.configuration.data_directory = data_dir
    corpus.configuration.save()

    return corpus
