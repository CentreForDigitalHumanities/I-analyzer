from addcorpus.models import Corpus
from tag.models import Tag, TagInstance

def test_tag_models(db, auth_user, mock_corpus):
    tag = Tag.objects.create(
        name='fascinating',
        description='some very interesting documents',
        user=auth_user
    )

    assert len(auth_user.tags.all()) == 1

    corpus = Corpus.objects.get(name=mock_corpus)

    for doc in ['1', '2', '3']:
        TagInstance.objects.create(
            tag=tag,
            corpus=corpus,
            document_id=doc,
        )

    assert len(tag.instances.all()) == 3
