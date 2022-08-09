from glob import glob
from os.path import basename
from datetime import datetime
import re
from flask import current_app

from addcorpus.extract import Combined, Constant, Metadata, CSV
from addcorpus.corpus import CSVCorpus
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults


class ParliamentNorway(Parliament, CSVCorpus):
    '''
    Class for indexing Norwegian parliamentary data
    '''

    title = "People & Parliament (Norway, 1814-2004)"
    description = "Speeches from the Storting"
    min_date = datetime(year=1814, month=1, day=1)
    max_date = datetime(year=2004, month=12, day=31)
    data_directory = current_app.config['PP_NORWAY_DATA']
    es_index = current_app.config['PP_NORWAY_INDEX']
    image = 'norway.JPG'
    language = 'norwegian'

    def sources(self, start, end):
        for csv_file in glob('{}**/*.csv'.format(self.data_directory)):
            year = re.search(r'\d{4}', csv_file)
            if year:
                date = datetime(year=int(year.group(0)), month=1, day=1)
                if start < date < end:
                    yield csv_file, {'year': year}

    book_label = field_defaults.book_label()
    book_label.extractor = Combined(
        CSV(field = 'title'),
        CSV(field = 'subtitle'),
        transform = lambda parts: '; '.join(parts)
    )

    page = field_defaults.page()
    page.extractor = CSV(field = 'page')

    speech = field_defaults.speech()
    speech.extractor = CSV(field = 'text')

    def __init__(self):
        self.fields = [
            self.book_label,
            self.page,
            self.speech,
        ]
