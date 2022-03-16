from glob import glob
import logging
import bs4
import re

from flask import current_app

from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus, Field
from corpora.parliament.uk import ParliamentUK, format_house, format_speaker
import corpora.parliament.utils.field_defaults as field_defaults

class ParliamentUKRecent(ParliamentUK, CSVCorpus):
    data_directory = current_app.config['PP_UK_RECENT_DATA']

    country = field_defaults.country()
    country.extractor = Constant(
        value='United Kingdom'
    )

    date = field_defaults.date()
    date.extractor = CSV(
        field='date_yyyy-mm-dd'
    )

    house = field_defaults.house()
    house.extractor = CSV(
        field='house',
        transform=format_house
    )

    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV(
        field='speech_id'
    )

    speech = field_defaults.speech()
    speech.es_mapping = ParliamentUK.speech.es_mapping
    speech.extractor = CSV(
        field='content',
        multiple=True,
        transform=lambda x : ' '.join(x)
    )

    speaker = field_defaults.speaker()
    speaker.extractor = CSV(
        field='speaker_name',
        transform=format_speaker
    )

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = CSV(
        field='speaker_id'
    )

    speech_type = field_defaults.speech_type()
    speech_type.extractor = CSV(
        field='speech_type'
    )

    debate_title = field_defaults.debate_title()
    debate_title.extractor = CSV(
        field='debate'
    )
    
    debate_id = field_defaults.debate_id()
    debate_id.extractor = CSV(
        field='debate_id'
    )

    topic = field_defaults.topic()
    topic.extractor = Combined(
        CSV(field='heading_major'),
        CSV(field='heading_minor'),
        transform=lambda x: ' '.join(x)
    )

    sequence = field_defaults.sequence()
    sequence.extractor = CSV(
        field='sequence'
    )

    column = field_defaults.column()

