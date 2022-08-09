import csv
from glob import glob
from datetime import datetime
import re
from flask import current_app
import os

from addcorpus.extract import Combined, Constant, Metadata, CSV
from addcorpus.corpus import CSVCorpus
from backend.corpora.parliament.utils.constants import document_context
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults
import corpora.parliament.utils.formatting as formatting

def remove_file_extension(filename):
    name, ext = os.path.splitext(filename)
    return name

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

    document_context = document_context(
        context_fields=['book_id'],
        context_display_name='book',
    )

    def sources(self, start, end):
        for csv_file in glob('{}/**/*.csv'.format(self.data_directory), recursive=True):
            year = re.search(r'\d{4}', csv_file)
            if year:
                date = datetime(year=int(year.group(0)), month=1, day=1)
                if start <= date <= end:
                    yield csv_file, {}

    book_id = field_defaults.book_id()
    book_id.extractor = CSV(
        field = 'source_file',
        transform = remove_file_extension,
    )

    book_label = field_defaults.book_label()
    book_label.extractor = Combined(
        CSV(field = 'title'),
        CSV(field = 'subtitle'),
        transform = lambda parts: '; '.join(parts)
    )

    date_earliest = field_defaults.date_earliest()
    date_earliest.extractor = CSV(
        field = 'year',
        transform = lambda value : formatting.get_date_from_year(value, 'earliest')
    )

    date_latest = field_defaults.date_latest()
    date_latest.extractor = CSV(
        field = 'year',
        transform = lambda value : formatting.get_date_from_year(value, 'latest')
    )

    page = field_defaults.page()
    page.extractor = CSV(field = 'page')

    speech = field_defaults.speech()
    speech.extractor = CSV(field = 'text')

    sequence = field_defaults.sequence()
    sequence.extractor = CSV(field = 'page')

    def __init__(self):
        self.fields = [
            self.book_id, self.book_label,
            self.date_earliest, self.date_latest,
            self.page,
            self.speech,
            self.sequence,
        ]
