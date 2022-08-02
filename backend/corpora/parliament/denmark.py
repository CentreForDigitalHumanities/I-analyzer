from datetime import datetime
from glob import glob
import logging
import re
from flask import current_app
from corpora.parliament.utils.constants import document_context

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, CSV
from addcorpus.corpus import CSVCorpus
import corpora.parliament.utils.field_defaults as field_defaults
import os

def get_date_from_year(value, limit='earliest'):
    if value and value.isnumeric():
        year = int(value)
        if limit == 'earliest':
            date = datetime(year=year, month=1, day=1)
        else:
            date = datetime(year=year, month=12, day=31)
        return date.strftime('%Y-%m-%d')

def get_book_id(page_id):
    if page_id:
        *book_id, page = page_id.split('_')
        return '_'.join(book_id)

def format_chamber(chamber):
    chambers = {
        'folketinget': 'Folketinget',
        'landstinget': 'Landstinget',
    }

    return chambers.get(chamber, chamber)

class ParliamentDenmark(Parliament, CSVCorpus):
    title = 'People & Parliament (Denmark, 1848-2008)'
    description = "Speeches from the Folketing and Landstinget"
    min_date = datetime(year = 1841, month = 1, day = 1)
    max_date = datetime(year=2008, month=12, day=31)
    data_directory = current_app.config['PP_DENMARK_DATA']
    es_index = current_app.config['PP_DENMARK_INDEX']
    image = current_app.config['PP_CANADA_IMAGE']
    es_settings = current_app.config['PP_ES_SETTINGS']
    es_settings['analysis']['filter'] = {
        "stopwords": {
          "type": "stop",
          "stopwords": "_danish_"
        },
        "stemmer": {
            "type": "stemmer",
            "language": "danish"
        }
    }

    language = 'danish'

    required_field = 'text'

    def sources(self, start, end):
        logger = logging.getLogger('indexing')

        for csv_file in glob('{}/**/*.csv'.format(self.data_directory), recursive=True):
            yield csv_file, {}



    book_label = field_defaults.book_label()
    book_label.extractor = CSV(field='title')

    book_id = field_defaults.book_id()
    book_id.extractor = CSV(
        field='id',
        transform = get_book_id
    )

    country = field_defaults.country()
    country.extractor = Constant('Denmark')

    chamber = field_defaults.chamber()
    chamber.extractor = CSV(
        field='chamber',
        transform = format_chamber,
    )

    date_earliest = field_defaults.date_earliest()
    date_earliest.extractor = CSV(
        field='year',
        transform= lambda value: get_date_from_year(value, 'earliest')
    )
    date_earliest.search_filter.lower = min_date
    date_earliest.search_filter.upper = max_date

    date_latest = field_defaults.date_latest()
    date_latest.extractor = CSV(
        field='year',
        transform= lambda value: get_date_from_year(value, 'latest')
    )
    date_earliest.search_filter.lower = min_date
    date_earliest.search_filter.upper = max_date

    page = field_defaults.page()
    page.extractor = CSV(field='page')

    speech = field_defaults.speech()
    speech.extractor = CSV(field='text')

    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV(field='id')

    def __init__(self):
        self.fields = [
            self.book_label, self.book_id,
            self.country,
            self.chamber,
            self.date_earliest, self.date_latest,
            self.speech,
            self.speech_id,
            self.page,
        ]
