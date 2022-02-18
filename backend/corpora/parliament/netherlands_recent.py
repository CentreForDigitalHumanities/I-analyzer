from glob import glob
from bs4 import BeautifulSoup
import re
import logging
from os.path import join
from datetime import datetime

from flask import current_app

from addcorpus.extract import Constant, Combined, XML
from addcorpus.corpus import XMLCorpus, Field
from addcorpus.filters import MultipleChoiceFilter
from corpora.parliament.netherlands import ParliamentNetherlands

with open(join(current_app.config['PP_NL_RECENT_DATA'], 'ParlaMint-NL.xml'), 'rb') as f:
    soup = BeautifulSoup(f.read(), 'xml')

class ParliamentNetherlandsRecent(ParliamentNetherlands, XMLCorpus):
    """ Corpus definition of recent Dutch parliamentary data,
    saved in ParlaMINT TEI xml format 
    """
    data_directory = current_app.config['PP_NL_RECENT_DATA']
    tag_entry = 'u'
    tag_toplevel = 'TEI'
    es_index = current_app.config['PP_NL_INDEX']
    min_date = datetime(year=2015, month=1, day=1)
    max_date = datetime(year=2020, month=12, day=31)

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for year in range(start.year, end.year):
            for xml_file in glob('{}/{}/*.xml'.format(self.data_directory, year)):
                yield xml_file


    def __init__(self):
        self.country.extractor = Constant(
            value='Netherlands'
        )

        self.country.search_filter = None

        self.date.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc','bibl', 'date'],
            toplevel=True
        )

        self.house.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc','bibl','idno'],
            toplevel=True,
            transform=self.format_house
        )

        self.debate_title.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'titleStmt', 'title'],
            multiple=True,
            toplevel=True,
            transform=lambda titles: titles[-2] if len(titles) else titles
        )

        self.debate_id.extractor = XML(
            tag=None,
            attribute='xml:id',
            toplevel=True,
        )

        self.topic.extractor = XML(
            tag=['note'],
            toplevel=True,
            recursive=True
        )

        self.party_id.extractor = XML(
            tag=None,
            attribute='who',
            transform=self.get_party_id
        )

        self.party.extractor = XML(
            tag=None,
            attribute='who',
            transform=self.get_party
        )
        self.party.search_filter = MultipleChoiceFilter(
            description='Search in speeches from the selected parties',
            option_count=50
        )
        self.party.visualizations = ['histogram']

        self.speech.extractor = XML(
            tag=['seg'],
            multiple=True,
            flatten=True,
        )

        self.speech_id.extractor = XML(
            tag=None,
            attribute='xml:id'
        )

        self.speaker.extractor = XML(
            tag=None,
            attribute='who',
            transform=self.get_speaker
        )

        self.speaker_id.extractor = XML(
            tag=None,
            attribute='who'
        )

        self.role.extractor = XML(
            tag=None,
            attribute='ana',
            transform=lambda x: x[1:].title()
        )

        self.party_full.extractor = XML(
            tag=None,
            attribute='who',
            transform=self.get_party_full
        )


    def format_house(self, url):
        ''' given a string of either eerstekamer.nl or tweedekamer.nl,
        return a string "Eerste Kamer" or "Tweede Kamer" '''
        try:
            split_string = url.split('.')[-2]
        except:
            return None
        if split_string=='eerstekamer':
            return 'Eerste Kamer'
        else:
            return 'Tweede Kamer'

    def get_speaker(self, who):
        person = self.get_person(who)
        surname = person.find('surname').text
        forename = person.find('forename').textc
        return '{} {}'.format(forename, surname)
    
    def get_person(self, who):
        person = soup.find(attrs={'xml:id':who[1:]})
        return person

    def get_party_id(self, who):
        person = self.get_person(who)
        if not person:
            return None
        party_id = person.find(attrs={'role': 'member'}).attrs['ref']
        return party_id
    
    def get_party(self, who):
        party_id = self.get_party_id(who)
        if not party_id:
            return None
        party = soup.find(attrs={'xml:id':party_id[1:]}).find(attrs={'full': 'init'}).text
        return party
    
    def get_party_full(self, who):
        party_id = self.get_party_id(who)
        if not party_id:
            return None
        party = soup.find(attrs={'xml:id':party_id[1:]}).find(attrs={'full': 'yes'}).text
        return party

    