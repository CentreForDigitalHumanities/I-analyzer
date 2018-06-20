'''
Collect corpus-specific information, that is, data structures and file
locations.
'''

import logging
logger = logging.getLogger(__name__)
import os
from os.path import join, isfile, splitext
from datetime import datetime, timedelta
import re

from ianalyzer import config_fallback as config
from ianalyzer import extract
from ianalyzer import filters
from ianalyzer.corpora.common import XMLCorpus, Field, until, after, string_contains

from pprint import pprint

# Source files ################################################################


class Kranten16xx(XMLCorpus):
    title = config.KRANTEN16XX_TITLE
    description = config.KRANTEN16XX_DESCRIPTION
    data_directory = config.KRANTEN16XX_DATA
    min_date = config.KRANTEN16XX_MIN_DATE
    max_date = config.KRANTEN16XX_MAX_DATE
    es_index = config.KRANTEN16XX_ES_INDEX
    es_doctype = config.KRANTEN16XX_ES_DOCTYPE
    es_settings = None

    def_tag_toplevel = 'text'
    def_tag_entry = 'p'

    page_tag_toplevel = 'alto'
    page_tag_entry = 'article'

    art_tag_toplevel = 'text'
    art_tag_entry = 'p'

    # New data members
    definition_pattern = re.compile(r'didl')
    page_pattern = re.compile(r'.*_(\d+)_alto')
    article_pattern = re.compile(r'.*_(\d+)_articletext')
    
    filename_pattern = re.compile(r'[a-zA-z]+_(\d+)_(\d+)')
    
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            d = []
            for filename in filenames:
                name, extension = splitext(filename)
                full_path = join(directory, filename)
                if extension != '.xml':
                    logger.debug(self.non_xml_msg.format(full_path))
                    continue
                def_match = self.definition_pattern.match(name)
                page_match = self.page_pattern.match(name)
                article_match = self.article_pattern.match(name)
                if def_match:                    d.append((full_path, 'definition'))
                if page_match:
                    d.append((full_path, 'page'))
                if article_match:
                    d.append((full_path, 'article'))
            yield d

if __name__ == '__main__':
    k = Kranten16xx()
    s = k.sources()
    d = k.documents()
