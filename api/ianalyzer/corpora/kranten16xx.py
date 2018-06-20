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

    xml_tag_toplevel = 'text'
    xml_tag_entry = 'p'

    # New data members
    filename_pattern = re.compile('[a-zA-z]+_(\d+)_(\d+)')
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                print(directory)
                name, extension = splitext(filename)
                full_path = join(directory, filename)
                # print(name)
                if extension != '.xml':
                    logger.debug(self.non_xml_msg.format(full_path))
                    # print(self.non_xml_msg.format(full_path))

    def sources_old(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                name, extension = splitext(filename)
                full_path = join(directory, filename)
                if extension != '.xml':
                    logger.debug(self.non_xml_msg.format(full_path))
                    continue
                match = self.filename_pattern.match(name)
                if not match:
                    logger.warning(self.non_match_msg.format(full_path))
                    continue

                issue, year = match.groups()
                if int(year) < start.year or end.year < int(year):
                    continue
                yield full_path, {
                    'year': year,
                    'issue': issue
                }

if __name__ == '__main__':
    k = Kranten16xx()
    print(k.sources())

