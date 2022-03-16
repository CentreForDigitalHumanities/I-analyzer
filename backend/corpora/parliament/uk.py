from glob import glob
import logging
import bs4
import re

from flask import current_app

from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus
from addcorpus.filters import MultipleChoiceFilter
from corpora.parliament.parliament import Parliament

def format_debate_title(title):
    if title.endswith('.'):
        title = title[:-1]

    return title.title()

def format_house(house):
    if 'commons' in house.lower():
        return 'House of Commons'
    if 'lords' in house.lower():
        return 'House of Lords'

def format_speaker(speaker):
    if speaker.startswith('*'):
        speaker = speaker[1:]

    return speaker.title()

def format_columns(columns):
    if columns:
        unique_columns = set(columns)
        if len(unique_columns) > 1:
            start = min(unique_columns)
            stop = max(unique_columns)
            return '{}-{}'.format(start, stop)
        if len(unique_columns) == 1:
            return list(unique_columns)[0]


class ParliamentUK(Parliament, CSVCorpus):
    title = 'People & Parliament (UK)'
    description = "Speeches from the House of Lords and House of Commons"
    data_directory = current_app.config['PP_UK_DATA']
    es_index = current_app.config['PP_UK_INDEX']
    image = current_app.config['PP_UK_IMAGE']
    es_settings = current_app.config['PP_ES_SETTINGS']
    es_settings['analysis']['filter'] = {
        "stopwords": {
          "type": "stop",
          "stopwords": "_english_"
        },
        "stemmer": {
            "type": "stemmer",
            "language": "english"
        }
    }

    field_entry = 'speech_id'

    def sources(self, start, end):
        logger = logging.getLogger('indexing')
        for csv_file in glob('{}/*.csv'.format(self.data_directory)):
            yield csv_file, {}

    country = Parliament._country()
    country.extractor = Constant(
        value='United Kingdom'
    )

    date = Parliament._date()
    date.extractor = CSV(
        field='speechdate',
    )

    debate_title = Parliament._debate_title()
    debate_title.extractor = CSV(
        field='debate',
        transform=format_debate_title
    )
     
    house =  Parliament._house()
    house.extractor = CSV(
        field='speaker_house',
        transform=format_house
    )
    
    debate_id = Parliament._debate_id()
    debate_id.extractor = CSV(
        field='debate_id'
    )
     
    speech = Parliament._speech()
    speech.extractor = CSV(
        field='text',
        multiple=True,
        transform=lambda x : ' '.join(x)
    )
    speech.es_mapping = {
        "type" : "text",
        "analyzer": "standard",
        "term_vector": "with_positions_offsets",
        "fields": {
        "stemmed": {
            "type": "text",
            "analyzer": "english"
            },
        "clean": {
            "type": 'text',
            "analyzer": "clean"
            },
        "length": {
            "type": "token_count",
            "analyzer": "standard",
            }
        }
    }
    
    speech_id = Parliament._speech_id()
    speech_id.extractor = CSV(
        field='speech_id'
    )

    speaker = Parliament._speaker()
    speaker.extractor = CSV(
        field='speaker',
        transform=format_speaker
    )
    
    column = Parliament._column()
    column.extractor = CSV(
        field='src_column',
        multiple=True,
        transform=format_columns
    )

    fields = [
        country, date,
        debate_title, debate_id,
        house,
        speech, speech_id,
        speaker,
        column,
    ]
