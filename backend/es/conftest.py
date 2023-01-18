import pytest
from time import sleep

from addcorpus.load_corpus import load_corpus
from ianalyzer.elasticsearch import elasticsearch
from es import es_index

@pytest.fixture()
def times_test_settings(settings):
    settings.CORPORA = {
        'times': 'corpora/times/times.py'
    }

    settings.TIMES_DATA = 'addcorpus/tests'
    settings.TIMES_ES_INDEX = 'ianalyzer-test-times'
    settings.TIMES_ES_DOCTYPE = 'article'
    settings.TIMES_IMAGE = 'times.jpg'
    settings.TIMES_SCAN_IMAGE_TYPE = 'image/png'
    settings.TIMES_DESCRIPTION_PAGE = 'times.md'

CORPUS_NAME = 'times'

@pytest.fixture
def corpus_definition(times_test_settings):
    corpus = load_corpus(CORPUS_NAME)
    yield corpus


@pytest.fixture(scope='module')
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

@pytest.fixture
def es_index_client(times_test_settings):
    """
    Create and populate an index for the mock corpus in elasticsearch.
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
    Create and populate an index for the mock corpus in elasticsearch.
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

# TODO: convert these to pytest fixtures

# class CustomTestClient(FlaskClient):
#     def times_login(self):
#         return self.login('times', TIMES_USER_PASSWORD)

#     def login(self, user_name, password):
#         return self.post('/api/login', data=json.dumps({
#             'username': user_name,
#             'password': password,
#         }), content_type='application/json')


# @pytest.fixture()
# def client(test_app):
#     test_app.test_client_class = CustomTestClient
#     with test_app.test_client() as client:
#         yield client


# @pytest.fixture(scope='session')
# def db(test_app):
#     """Session-wide test database."""
#     _db.app = test_app
#     _db.create_all()
#     yield _db

#     # performed after running tests
#     _db.drop_all()


# @pytest.fixture(scope='function')
# def session(db, request):
#     """Creates a new database session for a test."""
#     connection = db.engine.connect()
#     transaction = connection.begin()

#     options = dict(bind=connection, binds={})
#     session = db.create_scoped_session(options=options)

#     db.session = session
#     yield session

#     # performed after running tests
#     session.remove()
#     transaction.rollback()
#     connection.close()


# @pytest.fixture
# def times_user(session):
#     """ Ensure a user exists who has access to the Times corpus. """
#     user = User('times', generate_password_hash(TIMES_USER_PASSWORD))
#     role = Role(name='times_access')
#     corpus = Corpus(name='times')
#     role.corpora.append(corpus)
#     user.role = role
#     session.add(user)
#     session.add(corpus)
#     session.add(role)
#     session.commit()
#     return user


# @pytest.fixture
# def admin_role(session):
#     """ Ensure that there is an admin role present (needed for load_corpus methods) """
#     role = Role(name='admin')
#     session.add(role)
#     session.commit()
#     return role


# @pytest.fixture
# def requests():
#     """ Allow mocking network requests using the `responses` package. """
#     with responses.RequestsMock(assert_all_requests_are_fired=False) as mock:
#         mock.Response = responses.Response
#         yield mock
