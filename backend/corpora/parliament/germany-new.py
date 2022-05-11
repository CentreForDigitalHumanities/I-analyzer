from glob import glob
import logging
from datetime import datetime

from flask import current_app

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus
from addcorpus.filters import DateFilter, MultipleChoiceFilter
import corpora.parliament.utils.field_defaults_old as field_defaults


def date_to_year(date):
    return date.split('-')[0]

class ParliamentGermanyNew(Parliament, CSVCorpus):
    title = 'People & Parliament (Germany 1949-2021)'
    description = "Speeches from the Bundestag"
    min_date = datetime(year=1949, month=1, day=1)
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

    country = field_defaults.country()
    country.extractor = Constant(
        value='Germany'
    )

    date = field_defaults.date()
    date.extractor = CSV(
        field='date'
    )
    date.search_filter.lower = min_date

    house = field_defaults.house()
    house.extractor = Constant(
        value='Bundestag'
    )

    debate_id = field_defaults.debate_id()
    debate_id.extractor = CSV(
        field='session'
    )
    
    # in Germany, abbreviations are the most common way to refer to parties
    party = field_defaults.party()
    party.extractor = CSV(
        field='party_abbreviation'  
    )
    
    party_full = field_defaults.party_full()
    party_full.extractor = CSV(
        field='party_full_name'
    )

    party_id = field_defaults.party_id()
    party_id.extractor = CSV(
        field='party_id'
    )

    role = field_defaults.role()
    role.extractor = CSV(
        field='position_short'
    )
    role_long = field_defaults.role_long()
    role_long.extractor = CSV(
        field='position-long'
    )

    speaker = field_defaults.speaker()
    speaker.extractor = Combined(
        CSV(field='speaker_first_name'),
        CSV(field='speaker_last_name'),
        transform=lambda x: ' '.join(x)
    )

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = CSV(
        field='speaker_id'
    )

    speaker_aristocracy = field_defaults.speaker_aristocracy()
    speaker_aristocracy.extractor = CSV(
        field='speaker_aristocracy'
    )

    speaker_academic_title = field_defaults.speaker_academic_title()
    speaker_academic_title.extractor = CSV(
        field='speaker_academic_title'
    )

    speaker_birth_country = field_defaults.speaker_birth_country()
    speaker_birth_country.extractor = CSV(
        field='speaker_birth_country'
    )

    speaker_birthplace = field_defaults.speaker_birthplace()
    speaker_birthplace.extractor = CSV(
        field='speaker_birth_place'
    )

    speaker_birth_year = field_defaults.speaker_birth_year()
    speaker_birth_year.extractor = CSV(
        field='speaker_birth_date',
        transform=date_to_year
    )

    speaker_death_year = field_defaults.speaker_death_year()
    speaker_death_year.extractor = CSV(
        field='speaker_death_date',
        transform=date_to_year
    )
    
    speaker_gender = field_defaults.speaker_gender()
    speaker_gender.extractor = CSV(
        field='speaker_gender'
    )

    speaker_profession = field_defaults.speaker_profession()
    speaker_profession.extractor = CSV(
        field='speaker_profession'
    )

    speech = field_defaults.speech()
    speech.extractor = CSV(
        field='speech_content',
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

    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV(
        field='id'
    )

    url = field_defaults.url()
    url.extractor = CSV(
        field='document_url'
    )
    
    def __init__(self):
        self.fields = [
            self.country, self.date,
            self.debate_id,
            self.speaker, self.speaker_id,
            self.speaker_aristocracy, self.speaker_academic_title,
            self.speaker_birth_country, self.speaker_birthplace,
            self.speaker_birth_year, self.speaker_death_year, 
            self.speaker_gender, self.speaker_profession,
            self.role, self.role_long,
            self.party, self.party_full, self.party_id,
            self.speech, self.speech_id,
            self.url,
        ]



