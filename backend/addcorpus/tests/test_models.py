from addcorpus.models import Corpus
from datetime import datetime

def test_corpus_model(db):
    corpus = Corpus(
        name = 'test_corpus',
        description = 'test',
        languages = ['en'],
        max_date = datetime(1800, 1, 1),
        min_date = datetime(1900, 1, 1,),
    )
    corpus.save()

    assert Corpus.objects.filter(name = corpus.name)

    corpus.delete()

    assert not Corpus.objects.filter(name = corpus)
