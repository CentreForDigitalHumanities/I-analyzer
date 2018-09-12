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
from ianalyzer.corpora.common import HTMLCorpus, XMLCorpus, Field, until, after, string_contains


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
    image = config.TML_IMAGE

    html_tag_toplevel = ''  # in this case there is no usable top level and entry level for this corpus, essential info exists also outside <html> tags
    html_tag_entry = ''

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
                        yield full_path, {'id': filename
                                          }

    fields = [

        Field(
            name='id',
            display_name='ID',
            description='Article identifier.',
            extractor=extract.Metadata('id',
                                       transform=lambda x: x.lower()
                                       )
        ),
        Field(
            name='author',
            display_name='author',
            prominent_field=True,
            results_overview=True,
            description='Author.',
            extractor=extract.HTML(tag='p', attribute_filter={
                'attribute': 'class',
                'value': 'author',
            })
        ),

        Field(
            name='title',
            display_name='title',
            prominent_field=True,
            results_overview=True,
            description='Title.',
            extractor=extract.HTML(tag='p', attribute_filter={
                'attribute': 'class',
                'value': 'title',
            })
        ),

        Field(
            name='source',
            display_name='source',
            prominent_field=True,
            description='Source.',
            extractor=extract.HTML(tag='p', flatten=True,
                                   attribute_filter={
                                       'attribute': 'class',
                                       'value': 'tmlSource',
                                   })
        ),

        Field(
            name='Prepared_by',
            display_name='prepared by',
            description='Electronic version prepared by.',
            prominent_field=True,
            extractor=extract.HTML(tag='span', flatten=True,
                                   attribute_filter={
                                       'attribute': 'class',
                                       'value': 'eca-span',
                                   })
        ),

        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            prominent_field=True,
            extractor=extract.HTML(tag='div', flatten=True,
                                   attribute_filter={
                                       'attribute': 'id',
                                       'value': 'tml-text',
                                   })
        ),

        Field(
            name='copy statement',
            display_name='copy statement',
            description='Copy statement.',
            prominent_field=True,
            extractor=extract.HTML(tag='div', flatten=True,
                                   attribute_filter={
                                       'attribute': 'id',
                                       'value': 'cc-copy-statement',
                                   })
        ),

    ]



# if __name__ == '__main__':
#     t = Tml()
#     corpus_object = Tml()
#     # d = t.documents()
#     s = t.sources()
#     d = t.documents()
#     # s = t.sources()
#     alle_documenten = corpus_object.documents()
#     for si in d:
#         print(si)
#     for document in alle_documenten:
#         print(document)
#     # print(next(d))