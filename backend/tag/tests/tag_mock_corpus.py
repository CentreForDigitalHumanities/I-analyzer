import os
import datetime

from addcorpus.python_corpora.corpus import CSVCorpusDefinition, FieldDefinition
from addcorpus.python_corpora.extract import CSV
from addcorpus.es_mappings import keyword_mapping, main_content_mapping

here = os.path.abspath(os.path.dirname(__file__))


class TaggingMockCorpus(CSVCorpusDefinition):
    title = 'Tagging Mock Corpus'
    description = 'Mock corpus for tagging'
    es_index = 'tagging-mock-corpus'
    min_date = datetime.datetime(year=1, month=1, day=1)
    max_date = datetime.datetime(year=2022, month=12, day=31)
    image = 'corpus.jpg'
    data_directory = os.path.join(here, 'data')

    def sources(self, start, end):
        return (
            (os.path.join(self.data_directory, file), {})
            for file in os.listdir(self.data_directory)
        )
    languages = ['en']
    category = 'book'

    fields = [
        FieldDefinition(
            name='id',
            extractor=CSV('id'),
            es_mapping=keyword_mapping()
        ),
        FieldDefinition(
            name='content',
            display_type='text_content',
            extractor=CSV('content'),
            es_mapping=main_content_mapping(),
        )
    ]
