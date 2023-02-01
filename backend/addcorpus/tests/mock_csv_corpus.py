from addcorpus.corpus import CSVCorpus, Field
from addcorpus.extract import CSV
import os
import datetime
from addcorpus.media_url import media_url

here = os.path.abspath(os.path.dirname(__file__))

class MockCSVCorpus(CSVCorpus):
    """Example CSV corpus class for testing"""

    title = "Example"
    description = "Example corpus"
    es_index = 'nothing'
    min_date = datetime.datetime(year=1, month=1, day=1)
    max_date = datetime.datetime(year=2022, month=12, day=31)
    image = 'nothing.jpeg'
    data_directory = os.path.join(here, 'csv_example')
    field_entry = 'character'
    scan_image_type = 'image/png'

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

    def request_media(self, document, corpus_name):
        field_values = document['fieldValues']
        if field_values['character'] == 'HAMLET':
            filename = 'hamlet.png'
        else:
            filename = 'ghost.png'

        image_urls = [
            media_url(corpus_name, 'images/' + filename),
        ]

        return {'media': image_urls }

