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
from ianalyzer.corpora.common import HTMLCorpus, Field, until, after, string_contains


# Source files ################################################################


class Tml(HTMLCorpus):
    title = config.TML_TITLE
    description = config.TML_DESCRIPTION
    data_directory = config.TML_DATA
    min_date = config.TML_MIN_DATE
    max_date = config.TML_MAX_DATE
    es_index = config.TML_ES_INDEX
    es_doctype = config.TML_ES_DOCTYPE
    es_settings = None

    xml_tag_toplevel = 'html'
    xml_tag_entry = 'head'

    # New data members
    filename_pattern = re.compile('[a-zA-z]+_(\d+)_(\d+)')
    foldername_pattern = re.compile('^.*th$')

    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            # we hebben nu 2 variabelen per folder: de folder, en de bestanden erin (lijst)
            dir_match = self.foldername_pattern.match(directory)
            if dir_match:
                for filename in filenames:
                    if filename != '.DS_Store':
                        # we spitten nu losse betanden door
                        full_path = join(directory, filename)
                        yield full_path, {

                        }

    fields = [

        Field(
            name='title',
            display_name='Title',
            prominent_field=True,
            description='Article title.',
            extractor=extract.XML(tag='title')
        )

    ]


if __name__ == '__main__':
    t = Tml()
    # d = t.documents()
    s = t.sources()
    d = t.documents()

    for si in d:
        print(si)
    # print(next(d))
