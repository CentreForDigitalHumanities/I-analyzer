from addcorpus.models import Corpus
from tag.models import TagInstance, DOCS_PER_TAG_LIMIT
import pytest
from django.core.exceptions import ValidationError

def test_tag_models(db, auth_user, auth_user_tag, tagged_documents):
    assert len(auth_user.tags.all()) == 1

    instance, docs = tagged_documents

    assert len(auth_user_tag.instances.all()) == 1
    assert len(instance.document_ids) == len(docs)

def test_tag_lookup(mock_corpus, tagged_documents):
    instance, docs = tagged_documents
    corpus = Corpus.objects.get(name=mock_corpus)

    for doc in docs:
        assert TagInstance.objects.filter(corpus=corpus, document_ids__contains=[doc])

    assert not TagInstance.objects.filter(corpus=corpus, document_ids__contains=['not_tagged'])

def test_max_length(db, mock_corpus, auth_user_tag):
    corpus = Corpus.objects.get(name=mock_corpus)
    instance = TagInstance.objects.create(tag=auth_user_tag, corpus=corpus)

    for i in range(DOCS_PER_TAG_LIMIT):
        instance.document_ids.append(str(i))
        instance.save()
        instance.full_clean() # should validate without error

    instance.document_ids.append('too_much')
    instance.save()

    with pytest.raises(ValidationError):
        instance.full_clean()
