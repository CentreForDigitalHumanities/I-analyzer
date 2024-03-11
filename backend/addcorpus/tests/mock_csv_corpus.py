from addcorpus.python_corpora.corpus import CSVCorpusDefinition, FieldDefinition
from addcorpus.extract import CSV
import os
import datetime

here = os.path.abspath(os.path.dirname(__file__))

class MockCSVCorpus(CSVCorpusDefinition):
    """Example CSV corpus class for testing"""

    title = "Example"
    description = "Example corpus"
    es_index = 'nothing'
    min_date = datetime.datetime(year=1, month=1, day=1)
    max_date = datetime.datetime(year=2022, month=12, day=31)
    image = 'nothing.jpeg'
    data_directory = os.path.join(here, 'csv_example')
    field_entry = 'character'

    languages = ['en']
    category = 'book'

    def sources(self, start, end):
        for filename in os.listdir(self.data_directory):
            full_path = os.path.join(self.data_directory, filename)
            yield full_path, {
                    'filename': filename
                }

    fields = [
        FieldDefinition(
            name = 'character',
            extractor = CSV(field = 'character')
        ),
        FieldDefinition(
            name = 'lines',
            extractor = CSV(
                field = 'line',
                multiple = True,
            )
        )
    ]
