from glob import glob
import logging
import bs4
import re

from flask import current_app

from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus, Field
from corpora.parliament.uk import ParliamentUK

class ParliamentUKRecent(ParliamentUK, CSVCorpus):
    data_directory = current_app.config['PP_UK_RECENT_DATA']

    def __init__(self):
        self.country.extractor = Constant(
            value='United Kingdom'
        )
        self.country.search_filter = None

        self.date.extractor = CSV(
            field='date_yyyy-mm-dd'
        )

        self.house.extractor = CSV(
            field='house',
            transform=ParliamentUK.format_house
        )

        self.speech_id.extractor = CSV(
            field='speech_id'
        )

        self.speech.extractor = CSV(
            field='content',
            multiple=True,
            transform=lambda x : ' '.join(x)
        )

        self.speaker.extractor = CSV(
            field='speaker_name',
            transform=ParliamentUK.format_speaker
        )

        self.speaker_id.extractor = CSV(
            field='speaker_id'
        )

        self.speech_type.extractor = CSV(
            field='speech_type'
        )

        self.debate_title.extractor = CSV(
            field='debate'
        )

        self.debate_id.extractor = CSV(
            field='debate_id'
        )

        self.topic.extractor = Combined(
            CSV(field='heading_major'),
            CSV(field='heading_minor'),
            transform=lambda x: ' '.join(x)
        )

        sequence = Field(
            name='sequence',
            display_name='Sequence',
            description='Index of the sequence of speeches in a debate',
            es_mapping={'type': 'integer'},
            extractor=CSV(
                field='sequence'
            )
        )

        self.fields.append(sequence)
