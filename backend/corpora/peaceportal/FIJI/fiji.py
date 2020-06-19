import re
import os
import os.path as op
import logging
from flask import current_app

from addcorpus.extract import XML, Constant
from addcorpus.corpus import Field
from corpora.peaceportal.peaceportal import PeacePortal, categorize_material


class FIJI(PeacePortal):
    '''
    This is a fresh version of Ortal-Paz Saar's 'Funerary Inscriptions of Jews from Italy' corpus,
    updated to align with the PEACE portal index. This mostly implies that there are less fields
    than in the earlier version (i.e. the one under corpora/jewishinscriptions).
    '''

    data_directory = current_app.config['PEACEPORTAL_FIJI_DATA']
    es_index = current_app.config['PEACEPORTAL_FIJI_ES_INDEX']
    filename_pattern = re.compile('\d+')

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                name, extension = op.splitext(filename)
                full_path = op.join(directory, filename)
                if extension != '.xml':
                    logger.debug(self.non_xml_msg.format(full_path))
                    continue
                match = self.filename_pattern.match(name)
                if not match:
                    logger.warning(self.non_match_msg.format(full_path))
                    continue
                inscriptionID = match.groups()
                yield full_path, {
                    'inscriptionID': inscriptionID
                }

    def __init__(self):
        self.source_database.extractor = Constant(
            value='Funerary Inscriptions of Jews from Italy (Utrecht University)'
        )

        self._id.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'titleStmt', 'title'],
            toplevel=False,
        )

        self.url.extractor = Constant(
            value=None
        )

        # self.year.extractor = XML(
        #     tag=['teiHeader', 'fileDesc', 'sourceDesc',
        #          'msDesc', 'history', 'origin', 'origDate'],
        #     toplevel=False,
        # )

        self.transcription.extractor = XML(
            tag=['text', 'body', 'transcription'],
            toplevel=False,
            flatten=True
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
        )

        self.country.extractor = Constant(
            value='Italy'
        )

        self.settlement.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc',
                 'msDesc', 'history', 'origin', 'provenance'],
            toplevel=False,
        )

        self.material.extractor = XML(
            tag=['text', 'body', 'material'],
            toplevel=False,
            transform=lambda x: categorize_material(x)
        )

        self.material_details = XML(
            tag=['text', 'body', 'material'],
            toplevel=False,
        )

        self.language.extractor = XML(
            tag=['teiHeader', 'profileDesc', 'langUsage', 'language'],
            toplevel=False,
            multiple=True,
            transform=lambda x: normalize_language(x)
        )

        self.commentary.extractor = XML(
            tag=['text', 'body', 'commentary'],
            toplevel=False,
        )

        self.bibliography.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'publications', 'publication'],
            toplevel=False,
            multiple=True
        )

        self.location_details.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc', 'msDesc', 'msIdentifier', 'location'],
            toplevel=False
        )

        self.iconography.extractor = XML(
            tag=['text', 'body', 'iconographyType'],
            toplevel=False
        )



def normalize_language(languages):
    results = []
    for lang in languages:
        if not lang:
            results.append('Unknown')
            continue

        ltext = lang.lower().strip()
        if 'greek' in ltext or 'greeek' in ltext:
            results.append(select_greek(lang))
        if 'latin' in ltext:
            results.append(select_latin(lang))
        if 'hebrew' in ltext:
            results.append(select_hebrew(lang))
        if ltext == 'aramaic' or ltext == 'samaritan':
            return lang
        if '?' in ltext or ltext == 'x' or ltext == 'none':
            results.append('Unknown')
    return results


def select_greek(text):
    text = text.strip()
    if text in [
        "Greek", "Greek (?)", "Greeek",
        "Greek (some Latin characters)",
        "Latin (some Greek characters)",
        "Greek or Latin", "Latin and Greek (?)",
        "Latin in Greek characters"
        "Greek (transliterated Latin?)",
        "Greek with transliterated Latin (?)",
        "Greek with transliterated Latin formula",
    ]:
        return 'Greek'
    if text in [
        "Greek (in Hebrew characters)",
        "Greek in Latin characters (?)",
        "Latin (including transliterated Greek)",
        "transliterated Greek"
    ]:
        return 'Greek (transliterated)'

def select_latin(text):
    text = text.strip()
    if text in [
        "Latin", "Latin (?)",
        "Greek (some Latin characters)",
        "Latin (some Greek characters)",
        "Latin (including transliterated Greek)",
        "Greek or Latin", "Latin and Greek (?)",
        "Latin (transliterated Hebrew)"
    ]:
        return "Latin"

    if text in [
        "Latin in Greek characters",
        "Greek (transliterated Latin?)",
        "Greek with transliterated Latin (?)",
        "Greek with transliterated Latin formula",
    ]:
        return "Latin (transliterated)"


def select_hebrew(text):
    text = text.strip()

    if text in [
        "Hebrew", "Hebrew (?)"
    ]:
        return "Hebrew"

    if text in [
        "Latin (transliterated Hebrew)",
        "Hebrew (transliterated)",
    ]:
        return "Hebrew (transliterated)"




        # TODO: new fields

        # TODO: move to a comments field:
        # date_remarks
        # age_remarks (incl age)
        # iconography_desc


        # excluded (for now):
        # 3D_image
        # inscription_type

        # TODO: discuss
        # fascimile
        # photos_leonard
