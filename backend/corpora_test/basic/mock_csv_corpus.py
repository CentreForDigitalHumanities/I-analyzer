from addcorpus.python_corpora.corpus import CSVCorpusDefinition, FieldDefinition
from addcorpus.python_corpora.extract import CSV
import os
import datetime

here = os.path.abspath(os.path.dirname(__file__))

class MockCSVCorpus(CSVCorpusDefinition):
    '''
    Basic CSV corpus.

    Includes:
    - a tiny CSV dataset to test source extraction.
    - documentation pages

    Also suitable as a base class to test more specific settings.
    '''

    title = "Example"
    description = "Example corpus"
    es_index = 'nothing'
    min_date = datetime.datetime(year=1, month=1, day=1)
    max_date = datetime.datetime(year=2022, month=12, day=31)
    data_directory = os.path.join(here, 'source_data')
    citation_page = 'citation.md'

    field_entry = 'character'

    languages = ['en']
    category = 'book'

    def sources(self, **kwargs):
        for filename in os.listdir(self.data_directory):
            full_path = os.path.join(self.data_directory, filename)
            yield full_path, {
                    'filename': filename
                }

    fields = [
        FieldDefinition(
            name = 'character',
            extractor = CSV('character')
        ),
        FieldDefinition(
            name = 'lines',
            display_type = 'text_content',
            extractor = CSV(
                'line',
                multiple = True,
            )
        )
    ]
