from datetime import datetime
from addcorpus.corpus import Field, CSVCorpus
from addcorpus.extract import CSV
import os

# Fake corpus class for unit tests

here = os.path.abspath(os.path.dirname(__file__))

class MockCorpus(CSVCorpus):
    title = 'Mock Corpus'
    description = 'Corpus for testing'
    visualize = []
    min_date = datetime(year=1800, month=1, day=1)
    max_date = datetime(year=1899, month=12, day=31)
    es_index = 'ianalyzer-mock-corpus'
    image = 'test.jpeg'
    data_directory = 'bogus'

    def sources(self, start=min_date, end=max_date):
        for csv_file in os.listdir(os.path.join(here, 'source_files')):
            yield os.path.join(here, 'source_files', csv_file), {}

    date = Field(
        name = 'date',
        es_mapping = {
            'type': 'date',
        },
        extractor = CSV('date')
    )

    title_field = Field(
        name = 'title',
        es_mapping = {
            'type': 'text',
        },
        extractor = CSV('title')
    )

    content = Field(
        name = 'content',
        es_mapping= {
            'type': 'text',
            "fields": {
                "clean": {
                    "type": "text",
                },
                "stemmed": {
                    "type": "text",
                },
                "length": {
                    "type": "token_count",
                    'analyzer': 'standard',
                }
            }
        },
        extractor = CSV('content')
    )

    genre = Field(
        name = 'genre',
        es_mapping= {
            'type': 'keyword'
        },
        extractor = CSV('genre')
    )

    fields = [date, title_field, content, genre]
