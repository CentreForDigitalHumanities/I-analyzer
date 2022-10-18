def test_rechtspraak_unpack(test_corpus):
    assert test_corpus
    test_corpus.unpack(how='sample', per_year=1)


def test_rechtspraak_sources(test_corpus):
    s = test_corpus.sources()
    assert next(s)
