from datetime import datetime
from addcorpus.corpus import Field, CSVCorpus
from addcorpus.extract import CSV
import os

# Fake corpus class for unit tests

here = os.path.abspath(os.path.dirname(__file__))

class MultilingualMockCorpus(CSVCorpus):
    title = 'Multilingual Mock Corpus'
    description = 'A mixed-language corpus. Especially useful for testing character encoding'
    visualize = []
    min_date = datetime(year=2000, month=1, day=1)
    max_date = datetime(year=2022, month=12, day=31)
    es_index = 'ianalyzer-mixed-language-mock-corpus'
    image = 'test.jpeg'
    data_directory = 'bogus'

    def sources(self, start=min_date, end=max_date):
        for csv_file in os.listdir(os.path.join(here, 'sources_mixed_language')):
            yield os.path.join(here, 'sources_mixed_language', csv_file), {}


    content = Field(
        name = 'content',
        es_mapping= {
            'type': 'text',
        },
        extractor = CSV('content')
    )

    language = Field(
        name = 'language',
        es_mapping= {
            'type': 'keyword'
        },
        extractor = CSV('language')
    )

    fields = [content, language]
