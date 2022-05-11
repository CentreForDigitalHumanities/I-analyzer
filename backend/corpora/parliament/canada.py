from datetime import datetime
from glob import glob
import logging
import re
from flask import current_app

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus
from addcorpus.filters import MultipleChoiceFilter
import corpora.parliament.utils.field_defaults as field_defaults
from corpora.parliament.uk import format_house

class ParliamentCanada(Parliament, CSVCorpus):
    title = 'People & Parliament (Canada)'
    description = "Speeches from House of Commons"
    min_date = datetime(year = 1901, month = 1, day = 1)
    data_directory = current_app.config['PP_CANADA_DATA']
    es_index = current_app.config['PP_CANADA_INDEX']
    image = current_app.config['PP_CANADA_IMAGE']
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
    required_field = 'content'

    def sources(self, start, end):
        logger = logging.getLogger('indexing')
        for csv_file in glob('{}/*.csv'.format(self.data_directory)):
            yield csv_file, {}
    
    country = field_defaults.country()
    country.extractor = Constant(
        value='Canada'
    )

    date = field_defaults.date()
    date.extractor = CSV(
        field='date_yyyy-mm-dd'
    )
    date.search_filter.lower = min_date

    debate_id = field_defaults.debate_id()
    debate_id.extractor = CSV(
        field='speech_id',
        transform=lambda x: x[:re.search(r'\d{4}-\d{2}-\d{2}', x).span()[1]]
    )

    debate_title = field_defaults.debate_title()
    debate_title.extractor = CSV(
        field='heading1'
    )

    chamber = field_defaults.chamber()
    chamber.extractor = CSV(
        field='house',
        transform=format_house
    )

    party = field_defaults.party()
    party.extractor = CSV(
        field='speaker_party'
    )

    role = field_defaults.role()
    role.extractor = CSV(
        field='speech_type'
    )

    speaker = field_defaults.speaker()
    speaker.extractor = CSV(
        field='speaker_name'
    )

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = CSV(
        field='speaker_id'
    )

    speaker_constituency = field_defaults.speaker_constituency()
    speaker_constituency.extractor = CSV(
        field='speaker_constituency'
    )

    speech = field_defaults.speech()
    speech.extractor = CSV(
        field='content',
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

    topic = field_defaults.topic()
    topic.extractor = CSV(
        field='heading2'
    )

    subtopic = field_defaults.subtopic()
    subtopic.extractor = CSV(
        field='heading3'
    )

    def __init__(self):
        self.fields = [
            self.country, self.date,
            self.debate_id, self.debate_title,
            self.chamber,
            self.speaker, self.speaker_id, self.speaker_constituency, self.role, self.party,
            self.speech, self.speech_id,
            self.topic, self.subtopic,
        ]
