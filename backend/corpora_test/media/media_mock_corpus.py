import os

from corpora_test.csv.mock_csv_corpus import MockCSVCorpus
from media.media_url import media_url

here = os.path.abspath(os.path.dirname(__file__))

class MediaMockCorpus(MockCSVCorpus):
    data_directory = os.path.join(here, 'source_data')
    scan_image_type = 'image/png'
    citation_page = None

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

