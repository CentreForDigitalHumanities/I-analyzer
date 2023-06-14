from addcorpus.models import Corpus

def test_corpus_model(db):
    corpus = Corpus(name = 'test_corpus', description = 'test')
    corpus.save()

    assert Corpus.objects.filter(name = corpus.name)

    corpus.delete()

    assert not Corpus.objects.filter(name = corpus)
