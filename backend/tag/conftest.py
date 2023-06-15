import pytest
from addcorpus.load_corpus import load_all_corpora
from addcorpus.models import Corpus
from tag.models import Tag, TaggedDocument


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
def tagged_documents(auth_user_tag, admin_user_tag, mock_corpus):
    corpus = Corpus.objects.get(name=mock_corpus)
    docs = ['1', '2', '3', '4']
    tagged = []

    for doc in docs:
        tagged_doc = TaggedDocument.objects.create(doc_id=doc, corpus=corpus)
        tagged_doc.tags.add(*[auth_user_tag, admin_user_tag])
        tagged.append(tagged_doc)

    # remove user tag from last document
    tagged[-1].tags.remove(auth_user_tag)

    return tagged, docs
