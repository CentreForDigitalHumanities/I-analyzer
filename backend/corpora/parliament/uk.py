from glob import glob
import logging
import bs4
import re

from flask import current_app

from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus
from addcorpus.filters import MultipleChoiceFilter
from corpora.parliament.utils.formatting import format_page_numbers
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults

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

    country = field_defaults.country()
    country.extractor = Constant(
        value='United Kingdom'
    )

    date = field_defaults.date()
    date.extractor = CSV(
        field='speechdate',
    )

    debate_title = field_defaults.debate_title()
    debate_title.extractor = CSV(
        field='debate',
        transform=format_debate_title
    )
     
    house =  field_defaults.house()
    house.extractor = CSV(
        field='speaker_house',
        transform=format_house
    )
    
    debate_id = field_defaults.debate_id()
    debate_id.extractor = CSV(
        field='debate_id'
    )
     
    speech = field_defaults.speech()
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
    
    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV(
        field='speech_id'
    )

    speaker = field_defaults.speaker()
    speaker.extractor = CSV(
        field='speaker',
        transform=format_speaker
    )

    speaker_id = field_defaults.speaker_id()
    
    column = field_defaults.column()
    column.extractor = CSV(
        field='src_column',
        multiple=True,
        transform=format_page_numbers
    )

    sequence = field_defaults.sequence()

    def __init__(self):
        self.fields = [
            self.country, self.date,
            self.debate_title, self.debate_id,
            self.house,
            self.speech, self.speech_id, self.sequence,
            self.speaker, self.speaker_id,
            self.column,
        ]
