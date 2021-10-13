from glob import glob
import logging
import bs4
import re

from flask import current_app

from addcorpus.extract import XML, Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus, XMLCorpus
from corpora.parliament.parliament import Parliament

def is_speech(_, node):
    return node.name == 'p' and node.find('membercontribution')

class ParliamentUK(Parliament, CSVCorpus):
    title = 'People & Parliament (UK)'
    data_directory = current_app.config['PP_UK_DATA']
    es_index = current_app.config['PP_UK_INDEX']
    es_alias = current_app.config['PP_ALIAS']
    image = current_app.config['PP_UK_IMAGE']

    field_entry = 'speech_id'

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for csv_file in glob('{}/*.csv'.format(self.data_directory)):
            yield csv_file, {}
    
    def format_debate_title(title):
        if title.endswith('.'):
            title = title[:-1]

        return title.title()
    
    def format_house(house):
        if 'commons' in house.lower():
            return 'House of Commons'
        if 'lords' in house.lower():
            return 'House of Lords'
    
    def format_speaker(speaker):
        if speaker.startswith('*'):
            speaker = speaker[1:]
        
        return speaker.title()
    
    def format_columns(columns):
        if columns:
            unique_columns = set(columns)
            if len(unique_columns) > 1:
                start = min(unique_columns)
                stop = max(unique_columns)
                return '{}-{}'.format(start, stop)
            if len(unique_columns) == 1:
                return list(unique_columns)[0]
    
    def __init__(self):
        self.country.extractor = Constant(
            value='United Kingdom'
        )

        self.country.search_filter = None

        self.date.extractor = CSV(
            field='speechdate',
        )

        self.debate_title.extractor = CSV(
            field='debate',
            transform=ParliamentUK.format_debate_title
        )

        self.house.description = 'House that the speaker belongs to'

        self.house.extractor = CSV(
            field='speaker_house',
            transform=ParliamentUK.format_house
        )

        self.debate_id.extractor = CSV(
            field='debate_id'
        )

        self.speech.extractor = CSV(
            field='text',
            multiple=True,
            transform=lambda x : ' '.join(x)
        )

        self.speech_id.extractor = CSV(
            field='speech_id'
        )

        self.speaker.extractor = CSV(
            field='speaker',
            transform=ParliamentUK.format_speaker
        )

        self.column.extractor = CSV(
            field='src_column',
            multiple=True,
            transform=ParliamentUK.format_columns
        )