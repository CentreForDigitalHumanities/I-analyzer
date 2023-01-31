import pytest

from addcorpus.tests.mock_csv_corpus import MockCSVCorpus
import os

here = os.path.abspath(os.path.dirname(__file__))


target_documents = [
    {
        'character': 'HAMLET',
        'lines': ["Whither wilt thou lead me? Speak, I’ll go no further."]
    },
    {
        'character': 'GHOST',
        'lines': ["Mark me."]
    },
    {
        'character': 'HAMLET',
        'lines': ["I will."]
    },
    {
        'character': 'GHOST',
        'lines': [
            "My hour is almost come,",
            "When I to sulph’rous and tormenting flames",
            "Must render up myself."
        ]
    },
    {
        'character': 'HAMLET',
        'lines': ["Alas, poor ghost!"]
    },
    {
        'character': 'GHOST',
        'lines': [
            "Pity me not, but lend thy serious hearing",
            "To what I shall unfold."
        ]
    },
    {
        'character': 'HAMLET',
        'lines': ["Speak, I am bound to hear."]
    },
]


def test_csv():
    corpus = MockCSVCorpus()

    sources = list(corpus.sources(corpus.min_date, corpus.max_date))
    assert len(sources) == 1 and sources[0][1] == {'filename': 'example.csv'}

    docs = corpus.source2dicts(sources[0])
    for doc, target in zip(docs, target_documents):
        assert doc == target
