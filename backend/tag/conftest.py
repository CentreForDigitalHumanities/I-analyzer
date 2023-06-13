import pytest
from addcorpus.load_corpus import load_all_corpora
from addcorpus.models import Corpus
from tag.models import Tag, TagInstance


@pytest.fixture()
def mock_corpus(db):
    load_all_corpora()
    return 'tagging-mock-corpus'


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
def tagged_documents(auth_user_tag, mock_corpus):
    corpus = Corpus.objects.get(name=mock_corpus)
    docs = ['1', '2', '3']

    tagged = TagInstance.objects.create(
        tag=auth_user_tag,
        corpus=corpus,
        document_ids=docs,
    )

    return tagged, docs
