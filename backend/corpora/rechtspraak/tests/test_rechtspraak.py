from operator import itemgetter
from addcorpus.python_corpora.save_corpus import load_and_save_all_corpora
from addcorpus.models import Corpus

def test_rechtspraak_sources(test_corpus):
    s = test_corpus.sources()
    assert next(s)


def test_rechtspraak_documents(test_corpus, corpus_test_data):
    docs = sorted(list(test_corpus.documents()), key=itemgetter('date'))
    assert len(docs) == 3
    assert docs[0] == corpus_test_data['docs'][0]
    assert docs[1] == corpus_test_data['docs'][1]
    assert docs[2] == corpus_test_data['docs'][2]


def test_rechtspraak_required_fields(test_corpus):
    '''No way of testing this in this corpus,
    but serves as a blueprint for future corpora.
    '''
    docs = test_corpus.documents()
    assert len(list(docs)) == 3

def test_rechtspraak_validation(db, rechtspraak_test_settings):
    load_and_save_all_corpora()

    corpus = Corpus.objects.get(name='rechtspraak')
    assert corpus.ready_to_publish()
