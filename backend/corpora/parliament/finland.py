from datetime import datetime
from glob import glob

from addcorpus.corpus import XMLCorpus
from addcorpus.extract import XML, Combined, Constant, Metadata
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.formatting as formatting
import corpora.parliament.utils.field_defaults as field_defaults
import re
from bs4 import BeautifulSoup

from flask import current_app

def extract_party_data(node):
    return {
        'name': node['xml:id'],
        'role': node['role'],
        'id': '#party.' + node['xml:id']
    }

def get_all_party_data(soup):
    parties_list = soup.find('listOrg')
    party_data = map(extract_party_data, parties_list.find_all('org'))
    return {
        party['id']: party for party in party_data
    }

def extract_person_data(person):
    id = person['xml:id']
    surname = person.persName.surname.text.strip()
    forename = person.persName.forename.text.strip()
    name = ' '.join([forename, surname])
    role = person.persName.roleName.text.strip() if person.persName.roleName else None
    gender = person.sex.text.strip() if person.sex else None
    party_id = person.affliation['ref'] if person.affliation else None
    party = party_id.split('.', maxsplit=1)[1] if party_id else None
    birth_date = person.birth['when'] if person.birth else None
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

def get_people_data(soup):
    person_tags = soup.find_all('person')
    person_data = map(extract_person_data, person_tags)
    return {
        '#' + person['id']: person for person in person_data
    }

def person_attribute_transform_func(attribute):
    get_attribute = lambda who, people : people[who][attribute]
    return lambda values: get_attribute(*values)

def person_attribute_extractor(attribute):
    """Extractor that finds the speaker ID and returns one of the person's
    attributes defined in extract_person_data()"""
    return Combined(
        XML(attribute='who'),
        Metadata('persons'),
        transform = person_attribute_transform_func(attribute),
    )

def speech_metadata(speech):
    """Gets the `note` sibling to the speech."""

    return speech.parent.find('note')

class ParliamentFinland(Parliament, XMLCorpus):
    title = 'People and Parliament (Finland)'
    description = 'Speeches from the eduskunta'
    min_date = datetime(year=1920, month=1, day=1)
    data_directory = current_app.config['PP_FINLAND_DATA']
    es_index = current_app.config['PP_FINLAND_INDEX']

    def sources(self, start, end):
        for xml_file in glob('{}/**/*.xml'.format(self.data_directory), recursive=True):

            with open(xml_file) as infile:
                soup = BeautifulSoup(infile, features = 'xml')
            party_data = get_all_party_data(soup)
            person_data = get_people_data(soup)

            yield xml_file, {'parties': party_data, 'persons': person_data}

    language = 'finnish'
    image = 'finland.jpg'

    tag_toplevel = 'teiCorpus'
    tag_entry = 'u'

    country = field_defaults.country()
    country.extractor = Constant('Finland')

    party = field_defaults.party()
    party.extractor = person_attribute_extractor('party')

    party_id = field_defaults.party_id()
    party_id.extractor = person_attribute_extractor('party_id')

    role = field_defaults.parliamentary_role()
    role.extractor = person_attribute_extractor('role')

    speaker = field_defaults.speaker()
    speaker.extractor = person_attribute_extractor('name')

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = person_attribute_extractor('id')

    speaker_gender = field_defaults.speaker_gender()
    speaker_gender.extractor = person_attribute_extractor('gender')

    speaker_birth_year = field_defaults.speaker_birth_year()
    speaker_birth_year.extractor = person_attribute_extractor('birth_year')

    speech = field_defaults.speech()
    speech.extractor = XML(transform = str.strip)

    speech_type = field_defaults.speech_type()
    speech_type.extractor = XML(
        transform_soup_func = speech_metadata,
        attribute = 'speechType'
    )

    url = field_defaults.url()
    url.extractor = XML(
        transform_soup_func = speech_metadata,
        attribute = 'link'
    )

    def __init__(self):
        self.fields = [
            self.country,
            self.party_id, self.party,
            self.role,
            self.speaker,
            self.speaker_id, self.speaker_gender, self.speaker_birth_year,
            self.speech,
            self.speech_type,
            self.url,
        ]
