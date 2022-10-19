def test_rechtspraak_unpack(test_corpus):
    assert test_corpus
    test_corpus.unpack(how='sample', per_year=1)


def test_rechtspraak_sources(test_corpus):
    s = test_corpus.sources()
    assert next(s)


def test_rechtspraak_documents(test_corpus, corpus_test_data):
    docs = test_corpus.documents()
    assert list(docs)[0] == corpus_test_data['docs'][1]


def test_rechtspraak_required_fields(test_corpus):
    docs = test_corpus.documents()
    assert len(list(docs)) == 1
