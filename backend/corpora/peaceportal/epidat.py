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
            transform=lambda x: re.search('[1-2]{0,1}[0-9]{3}', x)[0],
        )

        self.transcription.extractor = XML(
            tag=['text', 'body', 'div'],
            toplevel=False,
            multiple=False,
            flatten=True,
            transform=lambda x: clean_newline_characters(x),
            transform_soup_func=extract_transcript
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
            transform=lambda x: ['M' if s ==
                                 '1' else 'F' if s == '2' else 'Unknown' for s in x]
        )

        self.country.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'origPlace', 'country'],
            toplevel=False,
            transform_soup_func=extract_country,
            flatten=True,
        )

        self.provenance.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'origPlace', 'country', 'region'],
            toplevel=False,
            flatten=True
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
            transform=lambda x: [''.join(s.split()) for s in x]
        )

        self.commentary.extractor = XML(
            tag=['text', 'body'],
            toplevel=False,
            transform_soup_func=extract_commentary,
            flatten=True
        )


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


def extract_country(soup):
    '''
    Helper function to extract country.
    This is needed because the output of `flatten` would otherwise include the text contents
    of the `<region>`.
    '''
    if not soup:
        return
    cloned_soup = copy(soup)
    region = cloned_soup.find('region')
    region.extract()
    return cloned_soup

    # TODO: add field
    # translation / Ubersetzung
    # fascimile (i.e. images)

    # TODO: move to a comments field:
    # dimensions (incl notes/remarks)
    # condition (remarks)
    # various types of commentary (if they exist) - currently Endkommentar is extracted, or the first commentary if taht doesn't exist.
    #       Other types of commentary include "Zeilenkommentar" and "Prosopographie"

    # excluded (for now):
    # title
    # organization (incl details, e.g. address)
    # licence
    # taxonomy (i.e. things like foto1, foto2 -> no working links to actual images)

    # TODO: discuss with OPS
    # objectType (e.g. Grabmal)
    # hand and decoNotes (e.g. <decoNote type='ornament'>floral</decoNote> or <decoNote type='ornament'>gestalterisch</decoNote>)

    # geo details (name and coordinates)

    # date of death for each person

