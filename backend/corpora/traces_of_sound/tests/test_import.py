

from addcorpus.python_corpora.load_corpus import load_corpus_definition


def test_tag_import(traces_corpora_settings):
    corpus = load_corpus_definition('traces-of-sound')

    documents = list(corpus.documents())
    assert len(documents) == 3

    expected = [
        { 'sound_carrier': None, 'sound_source': ['nightingale', 'leopard'], 'sound_quality': None },
        { 'sound_carrier': ['ground'], 'sound_source': None, 'sound_quality': ['loud'] },
        { 'sound_carrier': None, 'sound_source': ['rain'], 'sound_quality': ['soft'] },
    ]

    for doc, expected_doc in zip(documents, expected):
        for field in expected_doc:
            assert doc[field] == expected_doc[field]
