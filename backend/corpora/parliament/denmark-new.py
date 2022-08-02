from datetime import datetime
from glob import glob
import logging
from flask import current_app
import os

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, CSV, Metadata, Combined
from addcorpus.corpus import CSVCorpus
import corpora.parliament.utils.field_defaults as field_defaults
import corpora.parliament.utils.formatting as formatting
import corpora.parliament.utils.constants as constants

def format_party(abbreviation):
    return abbreviation

def extract_party_names(filename):
    with open(filename) as infile:
        lines = infile.readlines()

    data = map(lambda line: line.strip().split('\t'), lines)
    return dict(data)

def get_party_name(data):
    abbreviation, parties = data

    if abbreviation in parties:
        return parties[abbreviation]

def get_timestamp_from_id(id):
    return id[8:]


class ParliamentDenmarkNew(Parliament, CSVCorpus):
    title = 'People & Parliament (Denmark, 2009-2017)'
    description = "Speeches from the Folketing"
    min_date = datetime(year=2009, month=1, day=1)
    max_date = datetime(year=2017, month=12, day=31)
    data_directory = current_app.config['PP_DENMARK_NEW_DATA']
    es_index = current_app.config['PP_DENMARK_NEW_INDEX']
    image = 'denmark.jpg'
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
    delimiter = '\t'
    document_context = constants.document_context()
    document_context['context_fields'] = ['date']

    def sources(self, start, end):
        #get party abbreviations
        party_data = extract_party_names(os.path.join(self.data_directory, 'Parties.txt'))

        for filename in glob('{}/[0-9]*/*.txt'.format(self.data_directory), recursive=True):
            yield filename, {'parties': party_data}


    country = field_defaults.country()
    country.extractor = Constant('Denmark')

    date = field_defaults.date()
    date.extractor = CSV(field = 'Date')
    date.search_filter.lower = min_date
    date.search_filter.upper = max_date

    party = field_defaults.party()
    party.extractor = Combined(
        CSV(
            field = 'Party',
            transform = format_party,
        ),
        Metadata('parties'),
        transform = get_party_name
    )

    role = field_defaults.parliamentary_role()
    role.extractor = CSV(field = 'Role')

    speaker = field_defaults.speaker()
    speaker.extractor = CSV(field = 'Name')

    speaker_gender = field_defaults.speaker_gender()
    speaker_gender.extractor = CSV(field = 'Gender')

    speaker_birth_year = field_defaults.speaker_birth_year()
    speaker_birth_year.extractor = CSV(
        field = 'Birth',
        transform = formatting.extract_year,
    )

    speech = field_defaults.speech()
    speech.extractor = CSV(field = 'Text')

    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV(field = 'ID')

    subject = field_defaults.subject()
    subject.extractor = CSV(field = 'Subject 1')

    topic = field_defaults.topic()
    topic.extractor = CSV(field = 'Agenda title')

    sequence = field_defaults.sequence()
    sequence.extractor = CSV(
        field='ID',
        transform = get_timestamp_from_id
    )

    def __init__(self):
        self.fields = [
            self.country,
            self.date,
            self.party,
            self.role,
            self.speaker,
            self.speaker_gender, self.speaker_birth_year,
            self.speech,
            self.speech_id,
            self.sequence,
            self.subject,
            self.topic,
        ]
