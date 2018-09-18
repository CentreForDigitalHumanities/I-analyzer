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
import random
from pprint import pprint

from ianalyzer import config_fallback as config
from ianalyzer import extract
from ianalyzer import filters
from ianalyzer.corpora.common import XMLCorpus, Field, until, after, string_contains

# Source files ################################################################


class Troonredes(XMLCorpus):
    title = config.TROONREDES_TITLE
    description = config.TROONREDES_DESCRIPTION
    data_directory = config.TROONREDES_DATA
    min_date = config.TROONREDES_MIN_DATE
    max_date = config.TROONREDES_MAX_DATE
    es_index = config.TROONREDES_ES_INDEX
    es_doctype = config.TROONREDES_ES_DOCTYPE
    es_settings = None
    image = config.TROONREDES_IMAGE

    xml_tag_toplevel = 'doc'
    xml_tag_entry = 'doc'

    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                if filename != '.DS_Store':
                    name, extension = splitext(filename)
                    full_path = join(directory, filename)
                    if extension != '.xml':
                        logger.debug(self.non_xml_msg.format(full_path))
                        continue
                    # print(full_path, {'id': name})
                    yield full_path, {'id': name}

    fields = [
        Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the entry.',
            extractor=extract.Metadata('id')
        ),
        Field(
            name='title',
            display_name='Title',
            description='title.',
            extractor=extract.XML(tag='title', toplevel=True, recursive=True)
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            results_overview=True,
            preselected=True,
            extractor=extract.XML(tag='content', toplevel=True, recursive=True)
        ),
    ]


if __name__ == '__main__':
    corpus_object = Troonredes()
    alle_documenten = corpus_object.documents()
    for document in alle_documenten:
        print(document)
    s = corpus_object.sources()
    for ss in s:
        print(ss)
    # print(next(d))
