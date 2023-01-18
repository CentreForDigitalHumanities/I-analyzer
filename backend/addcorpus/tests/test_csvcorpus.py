import pytest

from addcorpus.corpus import CSVCorpus, Field
from addcorpus.extract import CSV
import os
import datetime

here = os.path.abspath(os.path.dirname(__file__))

class ExampleCSVCorpus(CSVCorpus):
    """Example CSV corpus class for testing"""

    title = "Example"
    description = "Example corpus"
    es_index = 'nothing'
    min_date = datetime.datetime(year=1, month=1, day=1)
    max_date = datetime.datetime(year=2022, month=12, day=31)
    image = 'nothing.jpeg'
    data_directory = os.path.join(here, 'csv_example')
    field_entry = 'character'

    def sources(self, start, end):
        for filename in os.listdir(self.data_directory):
            full_path = os.path.join(self.data_directory, filename)
            yield full_path, {
                    'filename': filename
                }

    fields = [
        Field(
            name = 'character',
            extractor = CSV(field = 'character')
        ),
        Field(
            name = 'lines',
            extractor = CSV(
                field = 'line',
                multiple = True,
            )
        )
    ]

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
    corpus = ExampleCSVCorpus()

    sources = list(corpus.sources(corpus.min_date, corpus.max_date))
    assert len(sources) == 1 and sources[0][1] == {'filename': 'example.csv'}

    docs = corpus.source2dicts(sources[0])
    for doc, target in zip(docs, target_documents):
        assert doc == target
