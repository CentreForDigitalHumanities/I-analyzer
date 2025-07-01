import logging
from datetime import datetime
from glob import glob
from os.path import join
from bs4 import BeautifulSoup
import re

from django.conf import settings

from addcorpus.python_corpora.corpus import XMLCorpusDefinition, FieldDefinition
from addcorpus.python_corpora.extract import XML, Constant, Combined, Order, Metadata, Pass
from addcorpus.es_mappings import keyword_mapping
from corpora.utils.constants import document_context
from corpora.parliament.parliament import Parliament
from corpora.parliament.utils.parlamint_v4 import extract_all_org_data, extract_people_data, person_attribute_extractor, current_party_id_extractor, organisation_attribute_extractor, POLITICAL_ORIENTATIONS, node_is_current
import corpora.parliament.utils.field_defaults as field_defaults


from ianalyzer_readers.xml_tag import Tag

logger = logging.getLogger('indexing')

def extract_speech(element):
    """
    Extracts all string values from the given BeautifulSoup element (in this case 
    one sentence from a speech) and joins them into a single string.
    Preserves spaces between words but not between words and punctuation.

    Args:
        element (bs4.PageElement): The BeautifulSoup element to process.

    Returns:
        str: A single string containing a sentence.
    """
    sentence = []
    for string in element.stripped_strings:
        # Dealing with punctuation
        if string in [',', '.', '!', '?', ';', ':', ')', ']', '}']:
            if sentence and sentence[-1].endswith(' '):
                sentence[-1] = sentence[-1][:-1] + string + ' '
            else:
                sentence.append(string + ' ')
        elif string in ["-"]:  # hyphenated-words
            if sentence and sentence[-1].endswith(' '):
                sentence[-1] = sentence[-1][:-1] + string
            else:
                sentence.append(string)
        elif string.startswith("'"):  # contractions are stored as "'s", "'m"
            if sentence and sentence[-1].endswith(' '):
                sentence[-1] = sentence[-1][:-1] + string + ' '
            else:
                sentence.append(string + ' ')
        elif string in ['(', '[', '{']:
            sentence.append(string)
        else:
            sentence.append(string + ' ')
    sentence[-1] = sentence[-1][:-1] if sentence and sentence[-1].endswith(' ') else sentence[-1] #trailspaces
    return ''.join(sentence)

def get_persons_metadata(directory):
    with open(join(directory, 'ParlaMint-TR-listPerson.xml'), 'rb') as f:
        soup = BeautifulSoup(f.read(), 'xml')
    return extract_people_data(soup)

def get_orgs_metadata(directory):
    with open(join(directory, 'ParlaMint-TR-listOrg.xml'), 'rb') as f:
        soup = BeautifulSoup(f.read(), 'xml')
    return extract_all_org_data(soup)

def transform_political_orientation(full_string):
    if full_string and '#orientation.' in full_string:
        return POLITICAL_ORIENTATIONS[full_string.split('.')[1]]
    else:
        return None

def transform_parliamentary_role(data):
    org_nodes, date = data
    for node in org_nodes:
        if node['ref'] == '#TBMM' and node['role'] == 'member' and node_is_current(node, date):
            return 'MP'

def transform_ministerial_role(data):
    org_nodes, date = data
    for node in org_nodes:
        if '#mstr.' in node['ref'] and node['role'] == 'head' and node_is_current(node, date):
            for child_node in node.children:
                if child_node.name == 'roleName' and child_node.get('xml:lang') == 'en':
                    return child_node.text.strip()

def transform_speaker_constituency(data):
    org_nodes, date = data
    for node in org_nodes:
        if node['ref'] == '#TBMM' and node['role'] == 'member' and node_is_current(node, date):
            if "#constituency-TR." in node['ana']:
                return node['ana'].split('#constituency-TR.')[1] if node['ana'].split('#constituency-TR.')[1] else None
            else:
                return 'Constituency unknown'

class ParlamintTurkiye(Parliament, XMLCorpusDefinition):
    '''
    Corpus definition for indexing Turkish parliamentary data from the ParlaMint dataset.
    '''

    title = "ParlaMint Türkiye"
    description = "Speeches and debates from Türkiye's parliament."
    min_date = datetime(year=2011, month=6, day=1)
    max_date = datetime(year=2022, month=12, day=31)
    data_directory = settings.PARLAMINT_TURKIYE_DATA
    es_index = getattr(settings, 'PARLAMINT_TURKIYE_INDEX', 'parlamint-turkiye')
    image = 'turkiye.jpg'
    description_page = 'parlamint_turkiye.md'

    tag_toplevel = Tag('TEI')
    tag_entry = Tag('u')
    languages = ['tr']

    category = 'parliament'
    document_context = document_context()

    def sources(self, start, end):
        # First collect metadata that is applicable to the whole dataset, like people and parties
        persons_metadata = get_persons_metadata(self.data_directory)
        orgs_metadata = get_orgs_metadata(self.data_directory)
        metadata = {
            'persons': persons_metadata,
            'organisations': orgs_metadata,
        }

        ## Then collect metadata that is applicable to the current file and find the paths to each xml file
        for year in range(start.year, end.year):
            for xml_file in glob('{}/{}/*.xml'.format(self.data_directory, year)):
                metadata['date'] = re.search(r"\d{4}-\d{2}-\d{2}", xml_file).group()
                yield xml_file, metadata

    country = field_defaults.country()
    country.extractor = Constant(
        value='Türkiye'
    )

    date = field_defaults.date()
    date.extractor = XML(
            Tag('teiHeader'),
            Tag('fileDesc'),
            Tag('sourceDesc'),
            Tag('bibl'),
            Tag('date'),
            toplevel=True
    )

    debate_id = field_defaults.debate_id()
    debate_id.extractor = XML(
            attribute='xml:id',
            toplevel=True,
    )

    speech = field_defaults.speech(language='tr')
    speech.extractor = XML(
            Tag('s'),
            multiple=True,
            extract_soup_func = extract_speech,
            transform=' '.join)

    speech_id = field_defaults.speech_id()
    speech_id.extractor = XML(
        attribute='xml:id'
    )

    sequence = field_defaults.sequence()
    sequence.extractor = Order(transform=lambda value: value + 1)

    speaker = field_defaults.speaker()
    speaker.extractor = person_attribute_extractor('name')

    speaker_id = field_defaults.speaker_id()
    speaker_id.extractor = person_attribute_extractor('id')

    speaker_gender = field_defaults.speaker_gender()
    speaker_gender.extractor = person_attribute_extractor('gender')

    speaker_birth_year = field_defaults.speaker_birth_year()
    speaker_birth_year.extractor = person_attribute_extractor('birth_year')

    speaker_birthplace = field_defaults.speaker_birthplace()
    speaker_birthplace.extractor = person_attribute_extractor('birthplace')

    speaker_wikimedia = FieldDefinition(
        name = 'speaker_wikimedia',
        display_name= 'Speaker Wikipedia',
        display_type='url',
        description='URL to Wikimedia page of the speaker',
        es_mapping=keyword_mapping(),
        searchable=False,
    )

    speaker_twitter = FieldDefinition(
        name = 'speaker_twitter',
        display_name= 'Speaker Twitter',
        display_type='url',
        description='URL to Twitter page of the speaker',
        es_mapping=keyword_mapping(),
        searchable=False,
    )

    parliamentary_role = field_defaults.parliamentary_role()
    parliamentary_role.extractor = Combined(
        person_attribute_extractor('org_nodes'),
        Metadata('date'),
        transform=transform_parliamentary_role
    )
    ministerial_role = field_defaults.ministerial_role()
    ministerial_role.extractor = Combined(
        person_attribute_extractor('org_nodes'),
        Metadata('date'),
        transform=transform_ministerial_role
    )

    current_party_id = field_defaults.party_id()
    current_party_id.extractor = current_party_id_extractor()

    current_party = field_defaults.party()
    current_party.extractor = organisation_attribute_extractor('name')

    current_party_full = field_defaults.party_full()
    current_party_full.extractor = organisation_attribute_extractor('full_name')

    current_party_wiki = FieldDefinition(
        name='party_wiki_url',
        display_name='Wikimedia URL',
        display_type='url',
        description='URL to Wikimedia page of the party',
        es_mapping=keyword_mapping(),
        searchable=False,
    )
    current_party_wiki.extractor = organisation_attribute_extractor('wikimedia')

    current_party_political_orientation = FieldDefinition(
        name='political_orientation',
        display_name='Political Orientation',
        description="Political leaning according to the ParlaMint team",
        es_mapping=keyword_mapping(),
        searchable=False
    )
    current_party_political_orientation.extractor = Pass(
        organisation_attribute_extractor('political_orientation'),
        transform=transform_political_orientation
    )

    speaker_constituency = field_defaults.speaker_constituency()
    speaker_constituency.extractor = Combined(
        person_attribute_extractor('org_nodes'),
        Metadata('date'),
        transform=transform_speaker_constituency
    )

    def __init__(self):
        self.fields = [
            self.debate_id,
            self.country,
            self.date,
            self.speech,
            self.speech_id,
            self.sequence,
            self.speaker,
            self.speaker_id,
            self.speaker_gender,
            self.speaker_birth_year,
            self.speaker_birthplace,
            self.speaker_wikimedia,
            self.speaker_twitter,
            self.parliamentary_role,
            self.ministerial_role,
            self.current_party_id,
            self.current_party,
            self.current_party_full,
            self.current_party_wiki,
            self.current_party_political_orientation,
            self.speaker_constituency
        ]

