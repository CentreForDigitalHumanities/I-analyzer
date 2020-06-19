import re
from copy import copy
from flask import current_app

from addcorpus.extract import XML, Constant, HTML
from addcorpus.corpus import Field
from corpora.peaceportal.peaceportal import PeacePortal, categorize_material, clean_newline_characters


class Epidat(PeacePortal):

    data_directory = current_app.config['PEACEPORTAL_EPIDAT_DATA']
    es_index = current_app.config['PEACEPORTAL_EPIDAT_ES_INDEX']

    def __init__(self):
        self.source_database.extractor = Constant(
            value='Epidat (Steinheim Institute)'
        )

        self._id.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc',
                 'msDesc', 'msIdentifier', 'idno'],
            multiple=False,
            toplevel=False,
            flatten=True
        )

        self.url.extractor = HTML(
            tag=['teiHeader', 'fileDesc', 'publicationStmt', 'idno'],
            multiple=False,
            toplevel=False,
            flatten=True,
            attribute_filter={
                'attribute': 'type',
                'value': 'url'
            }
        )

        self.year.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'origDate', 'date'],
            toplevel=False,
            transform=lambda x: get_year(x),
        )

        self.transcription.extractor = XML(
            tag=['text', 'body', 'div'],
            toplevel=False,
            multiple=False,
            flatten=True,
            transform=lambda x: clean_newline_characters(x),
            transform_soup_func=extract_transcript
        )

        self.transcription_german.extractor = XML(
            tag=['text', 'body',],
            toplevel=False,
            multiple=False,
            flatten=True,
            transform=lambda x: clean_newline_characters(x),
            transform_soup_func=extract_translation
        )

        self.names.extractor = XML(
            tag=['teiHeader', 'profileDesc',
                 'particDesc', 'listPerson', 'person'],
            flatten=True,
            multiple=True,
            toplevel=False,
        )

        self.sex.extractor = XML(
            tag=['teiHeader', 'profileDesc',
                 'particDesc', 'listPerson', 'person'],
            attribute='sex',
            multiple=True,
            toplevel=False,
            transform=lambda x: convert_sex(x)
        )

        self.dates_of_death.extractor = XML(
            tag=['teiHeader', 'profileDesc',
                 'particDesc', 'listPerson'],
            transform_soup_func=extract_death,
            attribute='when',
            multiple=False,
            toplevel=False,
        )

        self.country.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'origPlace', 'country'],
            toplevel=False,
            transform_soup_func=extract_country,
            transform=lambda x: clean_country(x),
            flatten=True,
        )

        self.region.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'origPlace', 'country', 'region'],
            toplevel=False,
            flatten=True
        )

        self.settlement.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'origPlace', 'settlement'],
            toplevel=False,
            flatten=True,
            transform_soup_func=extract_settlement,
        )

        self.location_details.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'origPlace', 'settlement', 'geogName'],
            toplevel=False,
            flatten=True,
            transform_soup_func=extract_location_details,
        )

        self.material.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'physDesc',
                 'objectDesc', 'supportDesc', 'support', 'p', 'material'],
            toplevel=False,
            flatten=True,
            transform=lambda x: categorize_material(x)
        )

        self.material_details.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'physDesc',
                 'objectDesc', 'supportDesc', 'support', 'p', 'material'],
            toplevel=False,
            flatten=True
        )

        self.language.extractor = XML(
            tag=['teiHeader', 'profileDesc', 'langUsage', 'language'],
            toplevel=False,
            multiple=True,
            transform=lambda x: get_language(x)
        )

        self.commentary.extractor = XML(
            tag=['text', 'body'],
            toplevel=False,
            transform_soup_func=extract_commentary,
            flatten=True
        )

        self.images.extractor = XML(
            tag=['facsimile', 'graphic'],
            multiple=True,
            attribute='url',
            toplevel=False
        )

        self.coordinates.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'origPlace', 'settlement', 'geogName', 'geo'],
            toplevel=False,
            multiple=False,
            flatten=True
        )

        self.iconography.extractor = XML(
             tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'physDesc', 'decoDesc', 'decoNote'],
             toplevel=False,
             multiple=False
        )

        self.bibliography.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'publications', 'publication'],
            toplevel=False,
            multiple=True
        )




def convert_sex(values):
    if not values: return ['Unknown']
    result = []
    for value in values:
        if value == '1': result.append('M')
        elif value == '2': result.append('F')
        else: result.append('Unknown')
    return result


def clean_country(text):
    if not text: return 'Unknown'
    if text.lower().strip() == 'tobedone': return 'Unknown'
    return text


def get_year(text):
    if not text or text == '--': return
    matches = re.search('[1-2]{0,1}[0-9]{3}', text)
    if matches: return matches[0]

def get_language(values):
    if not values: return ['Unknown']
    if 'German in Hebrew letters' in values:
        return ['German (transliterated)', 'Hebrew']
    return values


def extract_transcript(soup):
    '''
    Helper function to ensure correct extraction of the transcripts.
    Note that there are multiple formats in which these are stored,
    but the text that we need is always in the `<ab>` children of
    `['text', 'body', 'div']` (where div has `type=edition`, this is always the first one).
    '''
    if not soup:
        return
    return soup.find_all('ab')

def extract_translation(soup):
    '''
    Helper function to extract translation from the <body> tag
    '''
    if not soup:
        return
    translation = soup.find('div', { 'type': 'translation'})
    if translation:
        return translation.find_all('ab')
    else:
        return


def extract_commentary(soup):
    '''
    Helper function to extract commentary from the <body> tag.
    '''
    incl_header = soup.find('div', {'subtype': 'Endkommentar'})
    if incl_header:
        return incl_header.find('p')
    # if there is no endcommentary, return the first commentary we find, or None
    commentary = soup.find('div', {'type': 'commentary'})
    if commentary:
        return commentary.find('p')
    return None


def extract_death(soup):
    '''
    Helper function to extract date of death from multiple person tags.
    '''
    if not soup: return
    return soup.find_all('death')

def extract_country(soup):
    '''
    Helper function to extract country.
    This is needed because the output of `flatten` would otherwise include the text contents
    of the `<region>`.
    '''
    return clone_soup_extract_child(soup, 'region')


def extract_settlement(soup):
    return clone_soup_extract_child(soup, 'geogName')

def extract_location_details(soup):
    return clone_soup_extract_child(soup, 'geo')

def clone_soup_extract_child(soup, to_extract):
    '''
    Helper function to clone the soup and extract a child element.
    This is useful when the output of `flatten` would otherwise include the text contents
    of the child.
    '''
    if not soup:
        return
    cloned_soup = copy(soup)
    child = cloned_soup.find(to_extract)
    if child:
        child.extract()
    return cloned_soup



    # TODO: add field
    # date of death for each person

    # TODO: move to a comments field:
    # dimensions (incl notes/remarks)
    # condition (remarks)
    # geogName
    # various types of commentary (if they exist) - currently Endkommentar is extracted, or the first commentary if taht doesn't exist.
    #       Other types of commentary include "Zeilenkommentar" and "Prosopographie"
    # objectType (e.g. Grabmal)

    # excluded (for now):
    # title
    # organization (incl details, e.g. address)
    # licence
    # taxonomy (i.e. things like foto1, foto2 -> no working links to actual images)

    # TODO: discuss with OPS
    # hand and decoNotes (e.g. <decoNote type='ornament'>floral</decoNote> or <decoNote type='ornament'>gestalterisch</decoNote>)
