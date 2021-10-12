from glob import glob
import logging
import bs4
import re

from flask import current_app

from addcorpus.extract import XML, Constant, Combined
from addcorpus.corpus import XMLCorpus
from corpora.parliament.parliament import Parliament

def is_speech(_, node):
    return node.name == 'p' and node.find('membercontribution')

class ParliamentUK(Parliament, XMLCorpus):
    title = 'People & Parliament (UK)'
    data_directory = current_app.config['PP_UK_DATA']
    es_index = current_app.config['PP_UK_INDEX']
    es_alias = current_app.config['PP_ALIAS']

    tag_toplevel = 'hansard'
    tag_entry = is_speech

    image = current_app.config['PP_UK_IMAGE']

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for xml_file in glob('{}/*.xml'.format(self.data_directory)):
            yield xml_file, {}

    def clean_speech(speech):
        if speech and speech.startswith(': '):
            return speech[2:]
        return speech
    
    def find_house(node):
        is_house = lambda node: (node.name == 'housecommons') or (node.name == 'houselords')
        house = node.find_parent(is_house)
        return house
    
    def format_house(house_tag):
        if house_tag == 'housecommons':
            return 'House of Commons'
        elif house_tag == 'houselords':
            return 'House of Lords'
        return ''

    def format_topic(topic):
        if topic and len(topic) >= 1:
            topic = re.sub(r'\.$', '', topic)
            topic = topic[0].upper() + topic[1:].lower()
        return topic
    
    def find_last_column(node):
        "find the last column number before the start of the current node"
        is_tag = lambda x : type(x) == bs4.element.Tag

        #look for column id in previous nodes
        for prev_node in node.previous_siblings:          
            if is_tag(prev_node):
                #check if this is a column tag
                if prev_node.name == 'col':
                    return prev_node
                
                #check if the tag contains column tags
                cols = prev_node.find_all('col')
                if cols:
                    return cols[-1]
        
        #if none was found, go up a level
        parent = node.parent
        if parent:
            return ParliamentUK.find_last_column(parent)
    
    def format_columns(columns):
        if columns:
            start_col, end_col = columns
            if end_col:
                return '{}-{}'.format(start_col, end_col)
            return start_col


    def __init__(self):
        self.country.extractor = Constant(
            value='United Kingdom'
        )

        self.country.search_filter = None

        self.date.extractor = XML(
            tag='date',
            attribute='format',
            parent_level=4
        )

        self.house.extractor = XML(
            transform_soup_func=ParliamentUK.find_house,
            attribute='name',
            transform=ParliamentUK.format_house
        )

        self.speech.extractor = XML(
            tag='membercontribution',
            flatten=True,
            transform=ParliamentUK.clean_speech
        )

        self.speech_id.extractor = XML(
            attribute='id',
        )

        self.speaker.extractor = XML(
            tag='member',
            transform = lambda name : name.title() if name else None
        )

        self.topic.extractor = XML(
            tag=['title'],
            parent_level=1,
            transform=ParliamentUK.format_topic
        )

        self.column.extractor = Combined(
            XML(
                transform_soup_func=ParliamentUK.find_last_column
            ),
            XML(
                tag=['membercontribution', 'col'],
                multiple=True,
                transform=lambda cols : cols[-1] if cols else cols
                ),
            transform=ParliamentUK.format_columns
        )