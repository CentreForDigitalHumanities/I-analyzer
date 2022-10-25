from datetime import datetime
from glob import glob

from addcorpus.corpus import XMLCorpus
from addcorpus.extract import XML, Combined, Constant, Metadata
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.formatting as formatting
import corpora.parliament.utils.field_defaults as field_defaults
from corpora.parliament.utils.constants import document_context
import re
from bs4 import BeautifulSoup
from bs4.element import NavigableString

from flask import current_app

def extract_party_data(node):
    id = node['xml:id']

    full_name_node = node.find('orgName', full='yes')
    full_name = full_name_node.text if full_name_node else None

    abbreviation_node = node.find('orgName', full='init')
    name = abbreviation_node.text if abbreviation_node else full_name or id

    return {
        'name': name,
        'full_name': full_name,
        'role': node['role'],
        'id': id
    }

def extract_all_party_data(soup):
    parties_list = soup.find('listOrg')
    party_data = map(extract_party_data, parties_list.find_all('org'))
    make_id = lambda name: '#party.' + name if not name.startswith('party.') else '#' + name

    return {
        make_id(party['id']): party for party in party_data
    }

def extract_person_data(node):
    id = node['xml:id']
    surname = node.persName.surname.text.strip()
    forename = node.persName.forename.text.strip()
    name = ' '.join([forename, surname])
    role = node.persName.roleName.text.strip() if node.persName.roleName else None
    gender = node.sex.text.strip() if node.sex else None

    #get party id
    is_party_node = lambda node : node.name in ['affliation', 'affiliation'] and node.has_attr('ref')
    party_node = node.find(is_party_node)
    party_id = party_node['ref'] if party_node else None

    party = party_id.split('.', maxsplit=1)[1] if party_id else None
    birth_date = node.birth['when'] if node.birth else None
    birth_year = int(birth_date[:4]) if birth_date else None

    return {
        'id': id,
        'name': name,
        'role': role,
        'gender': gender,
        'party_id': party_id,
        'party': party,
        'birth_year': birth_year,
    }

def extract_people_data(soup):
    person_nodes = soup.find_all('person')
    person_data = map(extract_person_data, person_nodes)
    return {
        '#' + person['id']: person for person in person_data
    }

def extract_role_data(soup):
    role_nodes = soup.find('encodingDesc').find_all('category')

    # return dict that maps IDs to terms
    # data contains duplicate role IDs
    # go through data in reverse order
    # so earlier (more general) terms overwrite later (more specific) ones

    return {
        node['xml:id']: node.find('term').text.strip()
        for node in reversed(role_nodes)
    }

def metadata_attribute_transform_func(attribute):
    def get_attribute(which, collection):
        if which and collection and which in collection:
            value = collection[which][attribute]
            return clean_value(value)

    return lambda values: get_attribute(*values)

def person_attribute_extractor(attribute):
    """Extractor that finds the speaker ID and returns one of the person's
    attributes defined in extract_person_data()"""
    return Combined(
        XML(attribute='who'),
        Metadata('persons'),
        transform = metadata_attribute_transform_func(attribute),
    )

def party_attribute_extractor(attribute):
    """Extractor that finds the speaker's party and party's
    attributes defined in extract_party_data()'"""

    return Combined(
        person_attribute_extractor('party_id'),
        Metadata('parties'),
        transform = metadata_attribute_transform_func(attribute),
    )

def format_role(values):
    id, roles = values
    if id:
        clean_id = id.replace('#', '')
        return roles.get(clean_id, clean_id)

def speech_metadata(speech_node):
    """Gets the `note` sibling to the speech."""
    return speech_node.find_previous_sibling('note')

def find_topic(speech_node):
    return speech_node.parent.find_previous_sibling('head')

def find_debate_node(speech_node):
    return speech_node.find_parent('TEI')

def find_debate_title(speech_node):
    debate_node = find_debate_node(speech_node)
    return debate_node.teiHeader.find('title')

def find_date(speech_node):
    debate_node = find_debate_node(speech_node)
    return debate_node.teiHeader.find('date')

def clean_value(value):
    if type(value) == str or type(value) == NavigableString:
        stripped = value.strip()
        if len(stripped):
            return stripped
    if type(value) == int or type(value) == float:
        return value


class ParliamentFinland(Parliament, XMLCorpus):
    title = 'People and Parliament (Finland)'
    description = 'Speeches from the eduskunta'
    min_date = datetime(year=1907, month=1, day=1)
    data_directory = current_app.config['PP_FINLAND_DATA']
    es_index = current_app.config['PP_FINLAND_INDEX']

    def sources(self, start, end):
        for xml_file in glob('{}/**/*.xml'.format(self.data_directory), recursive=True):

            with open(xml_file) as infile:
                soup = BeautifulSoup(infile, features = 'xml')
            role_data = extract_role_data(soup)
            party_data = extract_all_party_data(soup)
            person_data = extract_people_data(soup)

            metadata = {
                'roles': role_data,
                'parties': party_data,
                'persons': person_data
            }

            yield xml_file, metadata

    language = 'finnish'
    description_page = 'finland.md'
    image = 'finland.jpg'

    document_context = document_context()

    tag_toplevel = 'teiCorpus'
    tag_entry = 'u'

    country = field_defaults.country()
    country.extractor = Constant('Finland')

    date = field_defaults.date()
    date.extractor = XML(
        transform_soup_func = find_date,
        attribute = 'when'
    )

    debate_id = field_defaults.debate_id()
    debate_id.extractor = XML(
        transform_soup_func = find_debate_node,
        attribute = 'xml:id'
    )

    debate_title = field_defaults.debate_title()
    debate_title.extractor = XML(
        transform_soup_func = find_debate_title,
        transform = clean_value,
    )

    party = field_defaults.party()
    party.extractor = party_attribute_extractor('name')

    party_id = field_defaults.party_id()
    party_id.extractor = person_attribute_extractor('party_id')

    party_role = field_defaults.party_role()
    party_role.extractor = party_attribute_extractor('role')

    role = field_defaults.parliamentary_role()
    role.extractor = Combined(
        XML(attribute = 'ana'),
        Metadata('roles'),
        transform = format_role,
    )

    speaker = field_defaults.speaker()
    speaker.extractor = person_attribute_extractor('name')

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = person_attribute_extractor('id')

    speaker_gender = field_defaults.speaker_gender()
    speaker_gender.extractor = person_attribute_extractor('gender')

    speaker_birth_year = field_defaults.speaker_birth_year()
    speaker_birth_year.extractor = person_attribute_extractor('birth_year')

    speech = field_defaults.speech()
    speech.extractor = XML(transform = clean_value)

    speech_id = field_defaults.speech_id()
    speech_id.extractor = XML(
        attribute = 'xml:id'
    )

    speech_type = field_defaults.speech_type()
    speech_type.extractor = XML(
        transform_soup_func = speech_metadata,
        attribute = 'speechType'
    )

    topic = field_defaults.topic()
    topic.extractor = XML(
        transform_soup_func = find_topic,
        transform = clean_value,
    )

    url = field_defaults.url()
    url.extractor = XML(
        transform_soup_func = speech_metadata,
        attribute = 'link'
    )

    sequence = field_defaults.sequence()
    sequence.extractor = XML(
        attribute = 'xml:id',
        transform = lambda value: value.split('_')[-1]
    )

    def __init__(self):
        self.fields = [
            self.country,
            self.date,
            self.debate_id, self.debate_title,
            self.party, self.party_id, self.party_role,
            self.role,
            self.speaker,
            self.speaker_id, self.speaker_gender, self.speaker_birth_year,
            self.speech,
            self.speech_id, self.speech_type,
            self.topic,
            self.url,
            self.sequence,
        ]
