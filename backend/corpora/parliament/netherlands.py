from glob import glob
import logging

from flask import current_app

from addcorpus.corpus import XMLCorpus
from addcorpus.extract import XML, Constant, Combined
from corpora.parliament.parliament import Parliament

class ParliamentNetherlands(Parliament, XMLCorpus):
    '''
    Class for indexing Dutch parliamentary data
    '''

    title = "People & Parliament (Netherlands)"
    description = "Minutes from European parliaments"
    data_directory = current_app.config['PP_NL_DATA']
    es_index = current_app.config['PP_NL_INDEX']
    es_alias = current_app.config['PP_ALIAS']
    tag_toplevel = 'root'
    tag_entry = 'speech'

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for xml_file in glob('{}/**/*.xml'.format(self.data_directory)):
            yield xml_file

    def __init__(self):
        self.country.extractor = Constant(
            value='Netherlands'
        )

        self.country.search_filter = None

        self.date.extractor = XML(
            tag=['meta','dc:date'],
            toplevel=True
        )

        self.house.extractor = XML(
            tag=['meta','dc:subject', 'pm:house'],
            toplevel=True,   
        )

        self.debate_title.extractor = XML(
            tag=['meta', 'dc:title'],
            toplevel=True,
        )

        self.debate_id.extractor = XML(
            tag=['meta', 'dc:identifier'],
            toplevel=True,
        )

        self.topic.extractor = XML(
            tag='topic',
            attribute=':title',
            parent_level=3,
        )

        self.speech.extractor = XML(
            flatten=True
        )

        self.speech_id.extractor = XML(
            attribute=':id'
        )

        self.speaker.extractor = Combined(
            XML(attribute=':function'),
            XML(attribute=':speaker'),
            transform=lambda x: ' '.join(x)
        )

        self.speaker_id.extractor = XML(
            attribute=':member-ref'
        )

        self.role.extractor = XML(
            attribute=':role'
        )

        self.party.extractor = XML(
            attribute=':party'
        )

        self.party_id.extractor = XML(
            attribute=':party-ref'
        )
