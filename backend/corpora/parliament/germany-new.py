from glob import glob
import logging

from flask import current_app

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus
from addcorpus.filters import MultipleChoiceFilter

class ParliamentGermanyNew(Parliament, CSVCorpus):
    title = 'People & Parliament (Germany Bundestag - 1949-2021)'
    description = "Speeches from the Bundestag"
    data_directory = current_app.config['PP_GERMANY_NEW_DATA']
    es_index = current_app.config['PP_GERMANY_NEW_INDEX']
    image = current_app.config['PP_GERMANY_NEW_IMAGE']
    es_settings = current_app.config['PP_ES_SETTINGS']
    es_settings['analysis']['filter'] = {
        "stopwords": {
          "type": "stop",
          "stopwords": "_german_"
        },
        "stemmer": {
            "type": "stemmer",
            "language": "german"
        }
    }

    field_entry = 'id'
    required_field = 'speech_content'

    def sources(self, start, end):
        logger = logging.getLogger('indexing')
        for csv_file in glob('{}/*.csv'.format(self.data_directory)):
            yield csv_file, {}

    def __init__(self):
        self.country.extractor = Constant(
            value='Germany'
        )

        self.country.search_filter = None

        self.date.extractor = CSV(
            field='date'
        )

        self.debate_id.extractor = CSV(
            field='session'
        )

        self.electoral_term.extractor = CSV(
            field='electoral_term'
        )

        self.party.extractor = CSV(
            field='party_abbreviation'
        )
        
        self.party_full.extractor = CSV(
            field='party_full_name'
        )

        self.party_id.extractor = CSV(
            field='party_id'
        )

        self.role.extractor = CSV(
            field='position_short'
        )
        self.role_long.extractor = CSV(
            field='position-long'
        )

        self.speaker.extractor = Combined(
            CSV(field='speaker_first_name'),
            CSV(field='speaker_last_name'),
            transform=lambda x: ' '.join(x)
        )

        self.speaker_id.extractor = CSV(
            field='speaker_id'
        )

        self.speaker_aristocracy.extractor = CSV(
            field='speaker_aristocracy'
        )

        self.speaker_academic_title.extractor = CSV(
            field='speaker_academic_title'
        )

        self.speaker_birth_country.extractor = CSV(
            field='speaker_birth_country'
        )

        self.speaker_birthplace.extractor = CSV(
            field='speaker_birth_place'
        )

        self.speaker_birth_date = CSV(
            field='speaker_birth_date'
        )

        self.speaker_death_date = CSV(
            field='speaker_death_date'
        )
        
        self.speaker_gender = CSV(
            field='speaker_gender'
        )

        self.speaker_profession = CSV(
            field='speaker_profession'
        )

        self.speech.extractor = CSV(
            field='speech_content',
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
                "analyzer": "german"
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
            field='id'
        )
        



