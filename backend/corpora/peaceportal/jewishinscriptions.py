import re
import os
import os.path as op
import logging
from flask import current_app

from addcorpus.extract import XML, Constant
from addcorpus.corpus import Field
from corpora.peaceportal.peaceportal import PeacePortal, categorize_material


class JewishInscriptions(PeacePortal):
    '''
    This is a fresh version of Ortal-Paz Saar's 'Funerary Inscriptions of Jews from Italy' corpus,
    updated to align with the PEACE portal index. This mostly implies that there are less fields
    than in the earlier version (i.e. the one under corpora/jewishinscriptions).
    '''

    data_directory = current_app.config['PEACEPORTAL_JEWISH_INSCRIPTIONS_DATA']
    es_index = current_app.config['PEACEPORTAL_JEWISH_INSCRIPTIONS_ES_INDEX']
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

        self.year.extractor = XML(
            tag=['teiHeader', 'fileDesc', 'sourceDesc',
                 'msDesc', 'history', 'origin', 'origDate'],
            toplevel=False,
        )

        self.transcription.extractor = XML(
            tag=['text', 'body', 'transcription'],
            toplevel=False,
            flatten=True
        )

        self.names.extractor = XML(
            tag=['text', 'body', 'namesMentioned'],
            toplevel=False,
        )

        self.sex.extractor = XML(
            tag=['text', 'body', 'sex'],
            toplevel=False,
        )

        self.country.extractor = Constant(
            value='Italy'
        )

        self.provenance.extractor = XML(
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
            tag=['text', 'body', 'language'],
            toplevel=False,
        )

        self.commentary.extractor = XML(
            tag=['text', 'body', 'commentary'],
            toplevel=False,
        )

        # excluded (for now):
        # date_remarks
        # incipit (what is it and what to do with it?)
        # names_hebrew
        # age
        # age_remarks
        # inscription_type
        # iconography_type
        # iconography_desc
        # no_surviving
        # location (storage location of published work)
        # publication
        # fascimile
        # photos_leonard
        # 3D_image
