from glob import glob
import logging
import bs4

from flask import current_app

from addcorpus.extract import XML, Constant
from addcorpus.corpus import XMLCorpus
from corpora.parliament.parliament import Parliament


class ParliamentUK(Parliament, XMLCorpus):
    title = 'People & Parliament (UK)'
    data_directory = current_app.config['PP_UK_DATA']
    es_index = current_app.config['PP_UK_INDEX']
    es_alias = current_app.config['PP_ALIAS']

    tag_toplevel = 'hansard'
    tag_entry = 'housecommons'

    image = current_app.config['PP_UK_IMAGE']

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for xml_file in glob('{}/*.xml'.format(self.data_directory)):
            yield xml_file, {}

    def __init__(self):
        self.country.extractor = Constant(
            value='United Kingdom'
        )

        self.country.search_filter = None

        self.date.extractor = XML(
            tag='date',
            attribute='format'
        )

        self.debate.extractor = XML(
            tag='debates',
            flatten=True
        )
