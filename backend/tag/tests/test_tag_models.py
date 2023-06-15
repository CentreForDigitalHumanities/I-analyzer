import pytest
from addcorpus.models import Corpus
from django.core.exceptions import ValidationError
from tag.models import TaggedDocument


def test_tag_models(db, auth_user, auth_user_tag, tagged_documents):
    assert len(auth_user.tags.all()) == 1
    assert len(auth_user_tag.tagged_docs.all()) == 3


def test_tag_lookup(mock_corpus, tagged_documents,
                    auth_user_tag, admin_user_tag):
    instances, docs = tagged_documents
    corpus = Corpus.objects.get(name=mock_corpus)

    for doc, instance in zip(docs, instances):
        tagged_docs = TaggedDocument.objects.get(doc_id=doc)
        assert tagged_docs == instance

    assert TaggedDocument.objects.filter(corpus=corpus).count() == 4
    assert TaggedDocument.objects.filter(
        corpus=corpus).exclude(tags=auth_user_tag).count() == 1
    assert TaggedDocument.objects.filter(tags=auth_user_tag).count() == 3
    assert TaggedDocument.objects.filter(tags=admin_user_tag)


def test_max_tags(db, auth_user_tag, too_much_docs):
    too_much_docs[0].tags.add(auth_user_tag)
    with pytest.raises(ValidationError):
        too_much_docs[1].tags.add(auth_user_tag)


def test_max_tags_reverse(db, mock_corpus_obj,
                          auth_user_tag, too_much_docs):
    with pytest.raises(ValidationError):
        auth_user_tag.tagged_docs.add(*too_much_docs)
