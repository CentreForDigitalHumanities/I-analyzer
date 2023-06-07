from addcorpus.models import Corpus

def test_corpus_model(db):
    corpus = Corpus(name = 'test_corpus', description = 'test.md')
    corpus.save()

    assert len(Corpus.objects.all()) == 1

    corpus.delete()

    assert len(Corpus.objects.all()) == 0
