import pytest
from django.contrib.auth.models import Group
from addcorpus.models import Corpus
from tag.models import DOCS_PER_TAG_LIMIT, Tag, TaggedDocument
from conftest import index_test_corpus, clear_test_corpus


@pytest.fixture(scope='session')
def mock_corpus():
    return 'tagging-mock-corpus'


@pytest.fixture()
def mock_corpus_obj(db, mock_corpus):
    return Corpus.objects.get(name=mock_corpus)


@pytest.fixture()
def auth_user_tag(db, auth_user):
    tag = Tag.objects.create(
        name='fascinating',
        description='some very interesting documents',
        user=auth_user
    )

    return tag


@pytest.fixture()
def admin_user_tag(db, admin_user):
    tag = Tag.objects.create(
        name='not fascinating at all',
        description='this is not my field of interest',
        user=admin_user
    )
    return tag


@pytest.fixture()
def auth_user_corpus_acces(db, auth_user, mock_corpus_obj):
    '''Give the auth user access to the mock corpus'''
    group = Group.objects.create()
    auth_user.groups.add(group)
    mock_corpus_obj.groups.add(group)


@pytest.fixture()
def tagged_documents(auth_user_tag, admin_user_tag, auth_user_corpus_acces, mock_corpus_obj):
    docs = ['1', '2', '3', '4']
    tagged = []

    for doc in docs:
        tagged_doc = TaggedDocument.objects.create(doc_id=doc,
                                                   corpus=mock_corpus_obj)
        tagged_doc.tags.add(*[auth_user_tag, admin_user_tag])
        tagged.append(tagged_doc)

    # remove user tag from last document
    tagged[-1].tags.remove(auth_user_tag)

    return tagged, docs


@pytest.fixture()
def near_max_tagged_documents(auth_user_tag, mock_corpus_obj):
    docs = []
    # Create maximum-1 number of tagged documents
    for i in range(DOCS_PER_TAG_LIMIT-1):
        tagged_doc = TaggedDocument.objects.create(corpus=mock_corpus_obj,
                                                   doc_id=i)
        auth_user_tag.tagged_docs.add(tagged_doc)
        docs.append(tagged_doc)
    return docs


@pytest.fixture()
def too_many_docs(mock_corpus_obj, near_max_tagged_documents):
    return TaggedDocument.objects.bulk_create([
        TaggedDocument(corpus=mock_corpus_obj, doc_id=DOCS_PER_TAG_LIMIT-1),
        TaggedDocument(corpus=mock_corpus_obj, doc_id=DOCS_PER_TAG_LIMIT)
    ])


@pytest.fixture()
def other_corpus(db):
    name = 'other-corpus'
    Corpus.objects.create(name=name)
    return name


@pytest.fixture(scope='session')
def index_mock_corpus(mock_corpus, es_client):
    index_test_corpus(es_client, mock_corpus)
    yield mock_corpus
    clear_test_corpus(es_client, mock_corpus)
