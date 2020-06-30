import re
from copy import copy
from flask import current_app

from addcorpus.extract import XML, Constant, HTML, ExternalFile, Combined
from addcorpus.corpus import Field
from corpora.peaceportal.peaceportal import PeacePortal, categorize_material, clean_newline_characters


class IIS(PeacePortal):
    data_directory = current_app.config['PEACEPORTAL_IIS_DATA']
    external_file_folder = current_app.config['PEACEPORTAL_IIS_TXT_DATA']
    es_index = current_app.config['PEACEPORTAL_IIS_ES_INDEX']


    def __init__(self):
        self.source_database.extractor = Constant(
            value='Inscriptions of Israel/Palestine (Brown University)'
        )

        self._id.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'idno'],
            multiple=False,
            toplevel=False,
            flatten=True,
            transform=lambda x: ''.join(x.lower().split())
        )

        self.url.extractor = HTML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'idno'],
            multiple=False,
            toplevel=False,
            flatten=True,
            transform=lambda x: 'https://library.brown.edu/iip/viewinscr/{}'.format(''.join(x.lower().split()))
        )

        # quick and dirty for now: extract value for 'notBefore'
        self.year.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'date'],
            toplevel=False,
            attribute='notBefore'
        )

        self.transcription.extractor = ExternalFile(
            stream_handler=extract_transcript
        )

        # TODO: change this to extract from source and add it transcription.english field
        # extract translation (i.e. English) from external file
        # self.translation.extractor = HTML(
        #     external_file={
        #         'xml_tag_toplevel': 'html',
        #         'xml_tag_entry': 'body'
        #     },
        #     tag=['div'],
        #     toplevel=True,
        #     multiple=False,
        #     flatten=True,
        #     attribute_filter={
        #         'attribute': 'id',
        #         'value': 'translation'
        #     },
        #     transform_soup_func=extract_paragraph
        # )

        # is not present in IIS data
        # self.names.extractor = XML(
        #     tag=['teiHeader', 'profileDesc',
        #          'particDesc', 'listPerson', 'person'],
        #     flatten=True,
        #     multiple=True,
        #     toplevel=False,
        # )

        # is not present in IIS data
        self.sex.extractor = Constant(
            value='Unknown'
        )

        self.country.extractor = Constant(
            value='Israel/Palestine'
        )

        self.region.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'placeName', 'region'],
            toplevel=False,
            flatten=True
        )

        self.settlement.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                 'history', 'origin', 'placeName', 'settlement'],
            toplevel=False,
            flatten=True
        )

        self.location_details.extractor = Combined(
            XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                    'history', 'origin', 'placeName'],
                toplevel=False,
                flatten=True
            ),
            XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                    'history', 'origin', 'p'],
                toplevel=False,
                flatten=True
            ),
            XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc',
                    'history', 'provenance'],
                toplevel=False,
                flatten=True
            )
        )


        self.material.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'physDesc',
                 'objectDesc', 'supportDesc'],
            attribute='ana',
            toplevel=False,
            flatten=True,
            transform=lambda x: categorize_material(x)
        )

        self.material_details.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'physDesc',
                 'objectDesc', 'supportDesc'],
            attribute='ana',
            toplevel=False,
            flatten=True
        )

        self.language.extractor = Combined(
            XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msContents',
                    'textLang'],
                attribute='mainLang',
                toplevel=False,
                transform=lambda x: normalize_language(x)
            ),
            XML(
                tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msContents',
                    'textLang'],
                attribute='otherLangs',
                toplevel=False,
                transform=lambda x: normalize_language(x)
            )
        )


        self.comments.extractor = XML(
            tag=['text'],
            toplevel=False,
            multiple=False,
            flatten=True,
            transform_soup_func=extract_comments
        )

        self.bibliography.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'publications', 'publication'],
            toplevel=False,
            multiple=True
        )


def extract_transcript(filestream):
    text = filestream.read().strip()
    filestream.close()
    # remove the tabs and spaces inherited from xml
    text = clean_newline_characters(text)
    if text:
        text = text.replace('\t', '')
    return text

def extract_paragraph(soup):
    '''
    Extract first <p> element from `soup`, ignore the rest.
    Ideal for ignoring <h2> headers in the HTML versions of the body.
    '''
    if not soup: return
    return soup.find('p')


def extract_comments(soup):
    '''
    Helper function to extract the commentary from either <body> or <back> (siblings under <text>)
    '''
    if not soup: return
    commentary_div = soup.find('div', { 'type': 'commentary' })
    return extract_paragraph(commentary_div)


def normalize_language(text):
    if not text: return
    ltext = text.lower().strip()
    if ltext in ['grc']: return 'Greek'
    if ltext in ['he', 'heb']: return 'Hebrew'
    if ltext in ['arc']: return 'Aramaic'
    if ltext in ['la', 'latin']: return 'Latin'


    # what to do with the dates from this corpus?
    # <date period="http://n2t.net/ark:/99152/p0m63njbxb9" notBefore="0001" notAfter="0100">First century CE</date>
    # <date period="http://n2t.net/ark:/99152/p0m63njjcn4" notBefore="0452" notAfter="0452">April 15, 452 CE</date>
    # <date period="http://n2t.net/ark:/99152/p0m63nj3bbf http://n2t.net/ark:/99152/p0m63njdf2z" notBefore="-0400" notAfter="-0100">probably 200-100 BCE, maybe 400-200 BCE</date>

    # TODO: add field

    # TODO: move to a comments field:
    # condition
    # layout description - notes
    # dimensions - support / dimension notes
    # origin notes
    # object description (e.g. amphora, handles)
    # handDesc (description of the letters)

    # excluded (for now):
    # revision history

    # MISSING (i.e. present in Epidat and Fiji)
    # person(s) - names (profileDesc is completely missing)
