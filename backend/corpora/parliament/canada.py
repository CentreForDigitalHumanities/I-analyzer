from glob import glob
import logging

from flask import current_app

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus
from addcorpus.filters import MultipleChoiceFilter


class ParliamentCanada(Parliament, CSVCorpus):
    title = 'People & Parliament (Canada)'
    description = "Speeches from House of Commons"
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

    def format_house(house):
        if 'commons' in house.lower():
            return 'House of Commons'
        if 'senate' in house.lower():  # pretty sure there are no entries from the senate in this corpus
            return 'Senate'
    
    def __init__(self):
        self.country.extractor = Constant(
            value='Canada'
        )

        self.country.search_filter = None

        self.date.extractor = CSV(
            field='date_yyyy-mm-dd'
        )

        self.debate_id.extractor = CSV(
            field='speech_id'
        )

        self.debate_title.extractor = CSV(
            field='heading1'
        )

        self.house.description = 'House that the speaker belongs to'

        self.house.extractor = CSV(
            field='house',
            transform=ParliamentCanada.format_house
        )

        self.house.search_filter=MultipleChoiceFilter(
            description='Search only in debates from the selected houses',
            option_count=2
        )

        self.party.extractor = CSV(
            field='speaker_party'
        )

        self.role.extractor = CSV(
            field='speech_type'
        )

        self.speaker.extractor = CSV(
            field='speaker_name'
        )

        self.speaker_id.extractor = CSV(
            field='speaker_id'
        )

        self.speaker_constituency.extractor = CSV(
            field='speaker_constituency'
        )

        self.speech.extractor = CSV(
            field='content',
            multiple=True,
            transform=lambda x : ' '.join(x)
        )
        
        self.speech.es_mapping = {
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

        self.speech_id.extractor = CSV(
            field='speech_id'
        )

        self.topic.extractor = CSV(
            field='heading2'
        )

        self.subtopic.extractor = CSV(
            field='heading3'
        )

        
        

        
