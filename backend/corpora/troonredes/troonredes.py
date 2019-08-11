'''
Collect corpus-specific information, that is, data structures and file
locations.
'''

import logging
logger = logging.getLogger(__name__)
import os
from os.path import dirname, join, isfile, splitext, isfile
from datetime import datetime, timedelta
import re
import random
from pprint import pprint

from flask import current_app

from addcorpus import extract
from addcorpus import filters
from addcorpus.corpus import XMLCorpus, Field, until, after, string_contains

# Source files ################################################################
MONARCHS = ['Willem I', 'Willem II', 'Willem III', 'Emma',
            'Wilhelmina', 'Juliana', 'Beatrix', 'Willem-Alexander']

SPEECH_TYPES = ['openingsrede', 'troonrede', 'inhuldigingsrede']


class Troonredes(XMLCorpus):
    title = "Troonredes"
    description = "Speeches by Dutch monarchs"
    min_date = datetime(year=1814, month=1, day=1)
    max_date = datetime(year=2018, month=12, day=31)
    data_directory = current_app.config['TROONREDES_DATA']
    es_index = current_app.config['TROONREDES_ES_INDEX']
    es_doctype = current_app.config['TROONREDES_ES_DOCTYPE']
    es_settings = None
    image = current_app.config['TROONREDES_IMAGE']
    word_models_present = isfile(
        join(
            dirname(current_app.config['CORPORA']['dutchannualreports']),
            current_app.config['WM_PATH'], 
            current_app.config['WM_BINNED_FN']
        )
    )

    tag_toplevel = 'doc'
    tag_entry = 'entry'

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
                    yield full_path, {'id': name}

    fields = [
        Field(
            name='date',
            display_name='Date',
            description='Date of the speech',
            extractor=extract.XML(tag='date'),
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            results_overview=True,
            csv_core=True,
            search_filter=filters.DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            sortable=True
        ),
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
            extractor=extract.XML(tag='title'),
            results_overview=True,
            search_field_core=True,
        ),
        Field(
            name='monarch',
            display_name='Monarch',
            description='Monarch that gave the speech.',
            extractor=extract.XML(tag='monarch'),
            es_mapping={'type': 'keyword'},
            results_overview=True,
            csv_core=True,
            visualization_type='term_frequency',
            search_filter=filters.MultipleChoiceFilter(
                description=(
                    'Accept only speeches given by '
                    'the relevant monarch.'
                ),
                options=MONARCHS
            ),
        ),
        Field(
            name='speech_type',
            display_name='Speech type',
            description='Type of speech.',
            extractor=extract.XML(tag='speech_type'),
            es_mapping={'type': 'keyword'},
            results_overview=True,
            csv_core=True,
            visualization_type='term_frequency',
            search_filter=filters.MultipleChoiceFilter(
                description=(
                    'Accept only speeches of '
                    'the relevant type.'
                ),
                options=SPEECH_TYPES
            ),
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            results_overview=True,
            search_field_core=True,
            visualization_type='wordcloud',
            extractor=extract.XML(tag='content')
        ),
    ]
