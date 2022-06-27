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
    if 'commons_wmhall' in house.lower():
        return 'House of Commons - Westminster Hall'
    elif 'commons' in house.lower():
        return 'House of Commons'
    elif 'lords' in house.lower():
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
    language = 'english'


    field_entry = 'speech_id'

    def sources(self, start, end):
        logger = logging.getLogger('indexing')
        for csv_file in glob('{}/*.csv'.format(self.data_directory)):
            yield csv_file, {}

    chamber =  field_defaults.chamber()
    chamber.extractor = CSV(
        field='house',
        transform=format_house
    )
    chamber.search_filter.option_count = 3

    country = field_defaults.country()
    country.extractor = Constant(
        value='United Kingdom'
    )

    date = field_defaults.date()
    date.extractor = CSV(
        field='date',
    )

    debate_title = field_defaults.debate_title()
    debate_title.extractor = CSV(
        field='debate',
        transform=format_debate_title
    )

    debate_id = field_defaults.debate_id()
    debate_id.extractor = CSV(
        field='debate_id'
    )

    speech = field_defaults.speech()
    speech.extractor = CSV(
        field='content',
        multiple=True,
        transform=lambda x : ' '.join(x)
    )

    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV(
        field='speech_id'
    )

    speech_type = field_defaults.speech_type()
    speech_type.extractor = CSV(
        field='speech_type'
    )

    speaker = field_defaults.speaker()
    speaker.extractor = CSV(
        field='speaker_name',
        transform=format_speaker
    )

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = CSV(
        field='speaker_id',
    )

    topic = field_defaults.topic()
    topic.extractor = CSV(
        field='heading_major',
    )

    subtopic = field_defaults.subtopic()
    subtopic.extractor = CSV(
        field='heading_minor',
    )

    sequence = field_defaults.sequence()
    sequence.extractor = CSV(
        field='sequence',
    )

    def __init__(self):
        self.fields = [
            self.country, self.date,
            self.debate_title, self.debate_id,
            self.topic, self.subtopic,
            self.chamber,
            self.speech, self.speech_id, self.speech_type,
            self.sequence,
            self.speaker, self.speaker_id,
        ]
