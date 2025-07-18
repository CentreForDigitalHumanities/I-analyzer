

from addcorpus.python_corpora.load_corpus import load_corpus_definition


def test_tag_import(traces_corpora_settings):
    corpus = load_corpus_definition('traces-of-sound')
    start = corpus.min_date
    end = corpus.max_date

    sources = corpus.sources(
        start=start,
        end=end
    )
    documents = list(corpus.documents(sources))
    assert len(documents) == 3

    for doc in documents:
        assert 'sound_carrier' in doc
        assert 'sound_quality' in doc
        assert 'sound_source' in doc
        if sound_carrier := doc.get('sound_carrier'):
            assert sound_carrier == 'ground'
        if sound_quality := doc.get('sound_quality'):
            assert sound_quality in ['loud', 'soft']
        if sound_source := doc.get('sound_source'):
            assert sound_source in ['nightingale', 'rain']

        

    