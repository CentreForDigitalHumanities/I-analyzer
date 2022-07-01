from datetime import datetime
from glob import glob
from addcorpus.corpus import CSVCorpus
from addcorpus.extract import CSV
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.formatting as formatting
import corpora.parliament.utils.field_defaults as field_defaults
import re

from flask import current_app

full_date_pattern = r'\d{4}-\d{2}-\d{2}'
partial_date_pattern = r'\d{4}'

def complete_partial_dates(datestring):
    if datestring:
        full_match = re.match(r'\d{4}-\d{2}-\d{2}', datestring)
        if full_match:
            return datestring

        partial_match = re.match(r'\d{4}', datestring) # some rows provide only the year
        if partial_match:
            return '{}-01-01'.format(partial_match.group(0))

def date_is_partial(datestring):
    if datestring:
        if not re.match(full_date_pattern, datestring) and re.match(partial_date_pattern, datestring):
            return True

def format_chamber(chamber):
    patterns = {
        'andra_kammaren': 'Other',
        'unified': 'Riksdag'
    }

    if chamber in patterns:
        return patterns[chamber]

    return chamber

def extract_debate_id(speech_id):
    if speech_id:
        pattern_match = re.match(r'(\w+-\w+)-\d+', speech_id)
        if pattern_match:
            return pattern_match.group(1)

class ParliamentSweden(Parliament, CSVCorpus):
    title = 'People and Parliament (Sweden)'
    description = 'Speeches from the Riksdag'
    min_date = datetime(year=1920, month=1, day=1)
    data_directory = current_app.config['PP_SWEDEN_DATA']
    es_index = current_app.config['PP_SWEDEN_INDEX']

    # TODO: remove es_settings after #771)
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

    def sources(self, start, end):
        for csv_file in glob('{}/**/*.csv'.format(self.data_directory), recursive=True):
            yield csv_file, {}


    language = 'swedish'
    image = 'sweden.jpg'

    date = field_defaults.date()
    date.extractor = CSV(
        field = 'date',
        transform = complete_partial_dates
    )
    date.search_filter.lower = min_date

    date_is_estimate = field_defaults.date_is_estimate()
    date_is_estimate.description = 'Indicates if the recorded month and day are estimates'
    date_is_estimate.extractor = CSV(
        field = 'date',
        transform = date_is_partial
    )

    chamber = field_defaults.chamber()
    chamber.extractor = CSV(
        field = 'chamber',
        transform = format_chamber
    )

    debate_id = field_defaults.debate_id()
    debate_id.extractor = CSV(
        field = 'speech_id',
        transform = extract_debate_id
    )

    speech = field_defaults.speech()
    speech.extractor = CSV(field = 'speech_text')

    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV(field = 'speech_id')

    speaker = field_defaults.speaker()
    speaker.extractor = CSV(field = 'person_name')

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = CSV(field = 'person_id')

    speaker_birth_year = field_defaults.speaker_birth_year()
    speaker_birth_year.extractor = CSV(
        field = 'person_born',
        transform = formatting.extract_year
    )

    speaker_death_year = field_defaults.speaker_death_year()
    speaker_death_year.extractor = CSV(
        field = 'person_dead',
        transform = formatting.extract_year
    )

    speaker_constituency = field_defaults.speaker_constituency()
    speaker_constituency.extractor = CSV(field = 'mp_district')

    speaker_gender = field_defaults.speaker_gender()
    speaker_gender.extractor = CSV(field = 'person_gender')

    party = field_defaults.party()
    party.extractor = CSV(field = 'mp_party')

    parliamentary_role = field_defaults.parliamentary_role()
    parliamentary_role.extractor = CSV(field = 'speaker_role')

    ministerial_role = field_defaults.ministerial_role()
    ministerial_role.extractor = CSV(field = 'minister_role')

    sequence = field_defaults.sequence()
    sequence.extractor = CSV(field = 'speech_order')

    def __init__(self):
        self.fields = [
            self.date,
            self.date_is_estimate,
            self.chamber,
            self.debate_id,
            self.speech,
            self.speech_id,
            self.speaker,
            self.speaker_id,
            self.speaker_birth_year,
            self.speaker_death_year,
            self.speaker_constituency,
            self.speaker_gender,
            self.party,
            self.parliamentary_role,
            self.ministerial_role,
            self.sequence,
        ]
