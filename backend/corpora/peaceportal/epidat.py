import re
from copy import copy
from flask import current_app

from addcorpus.extract import XML, Constant, HTML, Combined
from addcorpus.corpus import Field
from corpora.peaceportal.peaceportal import PeacePortal, categorize_material, clean_newline_characters, clean_commentary, join_commentaries


class Epidat(PeacePortal):

    data_directory = current_app.config['PEACEPORTAL_EPIDAT_DATA']
    es_index = current_app.config['PEACEPORTAL_EPIDAT_ES_INDEX']
    es_alias = current_app.config['PEACEPORTAL_ALIAS']

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
            tag=['text', 'body', ],
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

        self.comments.extractor = Combined(
            XML(
                tag=['text', 'body'],
                toplevel=False,
                transform_soup_func=extract_commentary,
            ),
            XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'physDesc',
                    'objectDesc', 'supportDesc', 'condition'],
                toplevel=False,
                flatten=True,
                transform=lambda x: 'CONDITION:\n{}\n'.format(x) if x else x
            ),
            XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'physDesc',
                    'objectDesc', 'supportDesc', 'support', 'p'],
                toplevel=False,
                transform_soup_func=extract_support_comments,
            ),
            transform=lambda x: join_commentaries(x)
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
            tag=['teiHeader', 'fileDesc', 'sourceDesc',
                 'msDesc', 'physDesc', 'decoDesc', 'decoNote'],
            toplevel=False,
            multiple=False
        )

        self.bibliography.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'msIdentifier', 'publications', 'publication'],
            toplevel=False,
            multiple=True
        )


def convert_sex(values):
    if not values:
        return ['Unknown']
    result = []
    for value in values:
        if value == '1':
            result.append('M')
        elif value == '2':
            result.append('F')
        else:
            result.append('Unknown')
    return result


def clean_country(text):
    if not text:
        return 'Unknown'
    if text.lower().strip() == 'tobedone':
        return 'Unknown'
    return text


def get_year(text):
    if not text or text == '--':
        return
    matches = re.search('[1-2]{0,1}[0-9]{3}', text)
    if matches:
        return matches[0]


def get_language(values):
    if not values:
        return ['Unknown']
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
    translation = soup.find('div', {'type': 'translation'})
    if translation:
        return translation.find_all('ab')
    else:
        return


def extract_commentary(soup):
    '''
    Helper function to extract all commentaries from the <body> tag.
    A single element will be returned with the commentaries found as text content.
    '''
    if not soup: return
    found = []
    commentaries = soup.find_all('div', {'type': 'commentary'})

    for commentary in commentaries:
        if commentary['subtype'] in ['Zitate', 'Zeilenkommentar', 'Prosopographie', 'Abkürzung', 'Endkommentar', 'Stilmittel']:
            p = commentary.find('p')
            if p:
                text = p.get_text()
                if text:
                    text = clean_commentary(text)
                    found.append('{}:\n{}\n'.format(commentary['subtype'].strip().upper(), text))

    if len(found) > 1:
        cloned_soup = copy(soup)
        cloned_soup.clear()
        cloned_soup.string = "\n".join(found)
        return cloned_soup
    else:
        return None

def extract_support_comments(soup):
    if not soup: return
    cloned_soup = copy(soup)
    cloned_soup.clear()

    commentaries = add_support_comment(soup, '', 'dim', 'DIMENSIONS')
    commentaries = add_support_comment(soup, commentaries, 'objectType', 'OBJECTTYPE')

    # add any additional text from the <p> element,
    # i.e. if there is text it is the very last node
    contents = soup.contents
    text = contents[len(contents) - 1].strip()
    if text:
        text = clean_commentary(text)
        commentaries = '{}{}:\n{}\n'.format(commentaries, 'SUPPORT', text)

    cloned_soup.string = commentaries
    return cloned_soup


def add_support_comment(soup, existing_commentaries, elem_name, commentary_name):
    elem = soup.find(elem_name)
    if elem:
        text = elem.get_text()
        if text:
            text = clean_commentary(text)
            return '{}{}:\n{}\n\n'.format(existing_commentaries, commentary_name, text)
    return existing_commentaries


def extract_death(soup):
    '''
    Helper function to extract date of death from multiple person tags.
    '''
    if not soup:
        return
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

    # TODO: move to a comments field:

    # excluded (for now):
    # title
    # organization (incl details, e.g. address)
    # licence
    # taxonomy (i.e. things like foto1, foto2 -> no working links to actual images)

