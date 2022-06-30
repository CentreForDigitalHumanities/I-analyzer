from dataclasses import field
from datetime import datetime
from addcorpus.corpus import CSVCorpus
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults

from flask import current_app


class ParliamentSweden(Parliament, CSVCorpus):
    title = 'People and Parliament (Sweden)'
    description = 'Speeches from the Riksdag'
    min_date = datetime(year=1920, month=1, day=1)
    data_directory = current_app.config['PP_SWEDEN_DATA']
    es_index = current_app.config['PP_SWEDEN_INDEX']

    # es settings (TODO: remove after #771)
    es_settings = current_app.config['PP_ES_SETTINGS']
    es_settings['analysis']['filter'] = {
        "stopwords": {
          "type": "stop",
          "stopwords": "_swedish_"
        },
        "stemmer": {
            "type": "stemmer",
            "language": "swedish"
        }
    }

    language = 'swedish'
    image = 'sweden.jpg'

    field_entry = 'speech_id'

    date = field_defaults.date()

    chamber = field_defaults.chamber()

    speech = field_defaults.speech()

    speech_id = field_defaults.speech_id()

    speaker = field_defaults.speaker()

    speaker_id = field_defaults.speaker_id()

    speaker_birth_year = field_defaults.speaker_birth_year()

    speaker_death_year = field_defaults.speaker_death_year()

    speaker_constituency = field_defaults.speaker_constituency()

    party = field_defaults.party()

    role = field_defaults.role()

    sequence = field_defaults.sequence()

    def __init__(self):
        self.fields = [
            self.date,
            self.chamber,
            self.speech,
            self.speech_id,
            self.speaker,
            self.speaker_id,
            self.speaker_birth_year,
            self.speaker_death_year,
            self.speaker_constituency,
            self.party,
            self.role,
            self.sequence,
        ]
