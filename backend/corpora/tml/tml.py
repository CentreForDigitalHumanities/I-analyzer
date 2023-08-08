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

from django.conf import settings

from addcorpus import extract
from addcorpus import filters
from addcorpus.corpus import HTMLCorpusDefinition, XMLCorpusDefinition, Field, until, after, string_contains

from addcorpus.es_mappings import keyword_mapping, main_content_mapping

# Source files ################################################################


class Tml(HTMLCorpusDefinition):
    title = "Thesaurus Musicarum Latinarum"
    description = "A collection of Medieval writings about music"
    min_date = datetime(year=300, month=1, day=1)
    max_date = datetime(year=1699, month=12, day=31)
    data_directory = settings.TML_DATA
    es_index = getattr(settings, 'TML_ES_INDEX', 'tml')
    image = 'tml.jpg'

    tag_toplevel = ''  # in this case there is no usable top level and entry level for this corpus, essential info exists also outside <html> tags
    tag_entry = ''

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
            es_mapping=keyword_mapping(),
            extractor=extract.Metadata('id',
                                       transform=lambda x: x.lower()
                                       )
        ),
        Field(
            name='author',
            display_name='author',
            es_mapping=keyword_mapping(),
            results_overview=True,
            search_field_core=True,
            csv_core=True,
            description='Author.',
            extractor=extract.HTML(tag='p', attribute_filter={
                'attribute': 'class',
                'value': 'author',
            })
        ),

        Field(
            name='title',
            display_name='title',
            results_overview=True,
            search_field_core=True,
            description='Title.',
            extractor=extract.HTML(
                tag='p',
                attribute_filter={
                    'attribute': 'class',
                    'value': 'title',
                },
                transform=lambda x: x.lstrip('[').rstrip(']'))
        ),

        Field(
            name='source',
            display_name='source',
            es_mapping=keyword_mapping(),
            results_overviews=True,
            csv_core=True,
            description='Source.',
            extractor=extract.HTML(tag='p',
                                   flatten=True,
                                   attribute_filter={
                                       'attribute': 'class',
                                       'value': 'tmlSource',
                                   },
                                   transform=lambda x: x.replace(
                                       'Source: ', '')
                                   )
        ),

        Field(
            name='Prepared_by',
            display_name='prepared by',
            description='Electronic version prepared by.',
            es_mapping=keyword_mapping(),
            extractor=extract.HTML(tag='span', flatten=True,
                                   attribute_filter={
                                       'attribute': 'class',
                                       'value': 'eca-span',
                                   },
                                   transform=lambda x: x.replace(
                                       'Electronic version prepared by ', '')
                                   )
        ),

        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            es_mapping=main_content_mapping(),
            search_field_core=True,
            results_overview=True,
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
            es_mapping=keyword_mapping(),
            extractor=extract.HTML(tag='div', flatten=True,
                                   attribute_filter={
                                       'attribute': 'id',
                                       'value': 'cc-copy-statement',
                                   })
        ),

    ]
