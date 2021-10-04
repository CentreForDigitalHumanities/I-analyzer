from glob import glob
import logging

from flask import current_app

from addcorpus.corpus import XMLCorpus
from addcorpus.extract import XML, Constant
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
    tag_entry = 'proceedings'

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

        self.debate.extractor = XML(
            tag='topic',
            flatten=True
        )