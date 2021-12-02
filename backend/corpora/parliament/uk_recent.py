from glob import glob
import logging
import bs4
import re

from flask import current_app

from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus, XMLCorpus
from corpora.parliament.uk import ParliamentUK

class ParliamentUKRecent(ParliamentUK, CSVCorpus):
    data_directory = current_app.config['PP_UK_RECENT_DATA']
    
    def __init__(self):
        self.date.extractor = CSV(
            field='date_yyyymmdd',
            transform=lambda x: '-'.join([x[:4], x[4:6], x[6:]])
        )

        self.house.extractor = CSV(
            field='house',
            transform=ParliamentUK.format_house
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

        self.speech_type = CSV(
            field='speech_tpe'
        )

        self.debate_title = CSV(
            field='debate'
        )

        self.topic = Combined(
            CSV(field='heading_major'),
            CSV(field='heading_minor'),
            transform=lambda x: ' '.join(x)
        )