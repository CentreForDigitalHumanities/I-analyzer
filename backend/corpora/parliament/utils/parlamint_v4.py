from ianalyzer_readers.extract import XML, Combined, Metadata
from bs4.element import NavigableString
import datetime

"""
This file was created as an updated utils file for the ParlaMint dataset, version 4.0. The previous utils file
is based on version 2.0.
"""

POLITICAL_ORIENTATIONS = {
    'L': 'Left',
    'C': 'Centre',
    'R': 'Right',
    'FL': 'Far Left',
    'FR': 'Far Right',
    'CL': 'Centre Left',
    'CR': 'Centre Right',
    'CCL': 'Centre to Centre Left',
    'CCR': 'Centre to Centre Right',
    'CLL': 'Centre Left to Left',
    'CRR': 'Centre Right to Right',
    'LLF': 'Left to Far Left',
    'RRF': 'Right to Far Right',
    'BT': 'Big Tent',
    'NP': 'Nonpartisan',
    'PP': 'Pirate Party',
    'SI': 'Single Issue',
    'SY': 'Syncretic',
    'NA': ''
}

def clean_value(value):
    if type(value) == str or type(value) == NavigableString:
        stripped = value.strip()
        if len(stripped):
            return stripped
    if type(value) == int or type(value) == float:
        return value
    return value

def extract_org_data(node):
    id = node['xml:id']

    full_name_node = node.find('orgName', full='yes')
    full_name = full_name_node.text if full_name_node else None

    abbreviation_node = node.find('orgName', full='abb')
    name = abbreviation_node.text if abbreviation_node else full_name or id

    wikimedia_uri_node = node.find('idno', type='URI', subtype='wikimedia')
    wikimedia_uri = wikimedia_uri_node.text if wikimedia_uri_node else None

    political_orientation_node = node.find('state', type='politicalOrientation')
    political_orientation = political_orientation_node.find('state')['ana'] if political_orientation_node else None

    return {
        'name': name,
        'full_name': full_name,
        'org_role': node['role'],
        'id': id,
        'wikimedia': wikimedia_uri,
        'political_orientation': political_orientation
    }

def extract_all_org_data(soup):
    orgs_list = soup.find('listOrg')
    org_data = map(extract_org_data, orgs_list.find_all('org'))
    make_id = lambda name: '#' + name
    org_dict = {}
    for org in org_data:
        org_dict[make_id(org['id'])] = org
    return org_dict

def extract_person_data(node):
    id = '#' + node['xml:id']
    surname = node.persName.surname.text.strip()
    forename = node.persName.forename.text.strip()
    name = ' '.join([forename, surname])
    role = node.persName.roleName.text.strip() if node.persName.roleName else None #too simple, needs to be able to have different values and be gotten from the org_node
    gender = node.sex['value'].strip() if node.sex else None

    #get org id
    is_org_node = lambda node: node.name in ['affliation', 'affiliation'] and node.has_attr('ref')
    org_nodes = node.find_all(is_org_node)
    org_ids = [org_node['ref'] if org_node else None for org_node in org_nodes]
    birth_date = node.birth['when'] if node.birth else None
    birth_year = int(birth_date[:4]) if birth_date else None
    birthplace = node.birth.placeName.text.strip() if node.birth and node.birth.placeName else None

    wikimedia_uri_node = node.find('idno', type='URI', subtype='wikimedia')
    wikimedia_uri = wikimedia_uri_node.text if wikimedia_uri_node else None

    twitter_uri_node = node.find('idno', type='URI', subtype='twitter')
    twitter_uri = twitter_uri_node.text if twitter_uri_node else None

    return {
        'id': id,
        'name': name,
        'role': role,
        'gender': gender,
        'org_ids': org_ids,
        'org_nodes': org_nodes,  # unsure about this still: might be a bit of a memory leak to store the nodes in the metadata
        'birth_year': birth_year,
        'birthplace': birthplace,
        'wikimedia': wikimedia_uri,
        'twitter': twitter_uri,
    }

def extract_people_data(soup):
    person_nodes = soup.find_all('person')
    person_data = map(extract_person_data, person_nodes)
    return {
       person['id']: person for person in person_data
    }

def extract_role_data(soup):
    role_nodes = soup.find('encodingDesc').find_all('category')
    # return dict that maps IDs to terms data contains duplicate role IDs
    # go through data in reverse order so earlier (more general) terms 
    # overwrite later (more specific) ones
    return {
        node['xml:id']: node.find('term').text.strip()
        for node in reversed(role_nodes)
    }

def metadata_attribute_transform_func(attribute):
    """
    Creates a transformation function that extracts and cleans a specific 
    attribute from a collection.
    """
    def get_attribute(which, collection):
        if which and collection and which in collection:
            value = collection[which][attribute]
            return clean_value(value)

    return lambda values: get_attribute(*values)

def person_attribute_extractor(attribute, id_attribute = 'who'):
    """Extractor that finds the speaker ID and returns one of the person's
    attributes defined in extract_person_data()"""
    return Combined(
        XML(attribute=id_attribute),
        Metadata('persons'),
        transform = metadata_attribute_transform_func(attribute),
    )

def current_party_id_extractor():
    """Extractor that finds the current party, given a date
    if no date is given, it return the last party in the node"""
    return Combined(
        person_attribute_extractor('id'),
        Metadata('persons'),
        Metadata('date'),
        transform=transform_current_party_id
    )

def organisation_attribute_extractor(attribute):
    """Extractor that finds the speaker's party and party's
    attributes defined in extract_party_data()"""
    return Combined(
        current_party_id_extractor(),
        Metadata('organisations'),
        transform = metadata_attribute_transform_func(attribute),
    )

def node_is_current(node, date):
    """Checks if the node is current at the given date
    i.e. if the date is between the from and to dates of the node"""
    if node and date:
        start_date = node.get('from', None)
        end_date = node.get('to', None)
        if (start_date and end_date and start_date <= date <= end_date) or \
        (start_date and start_date <= date) or \
        (end_date and end_date >= date):
            return True
        else:
            return False
    else:
        return False

def transform_current_party_id(data):
    id, persons, date = data
    current_parties = []
    is_party_node = lambda node: 'party' in node['ref']
    party_nodes = [node for node in persons[id]['org_nodes'] if node and is_party_node(node)]
    if len(party_nodes) == 0:
        return 'NA'

    for node in party_nodes:
        if node_is_current(node, date):
            current_parties.append(node['ref'])

    if len(current_parties) == 1:
        return current_parties[0]
    elif len(current_parties) == 0:
        return party_nodes[-1].get('ref', 'NA')
    else:
        return current_parties[-1] #return the last org in the list since that is usually the most recent one.
