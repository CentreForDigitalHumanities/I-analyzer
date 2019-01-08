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
from pprint import pprint

from ianalyzer import config_fallback as config
from ianalyzer import extract
from ianalyzer import filters
from ianalyzer.corpora.common import XMLCorpus, Field, until, after, string_contains


# Source files ################################################################


class Spectators(XMLCorpus):
    title = config.SPECTATORS_TITLE
    description = config.SPECTATORS_DESCRIPTION
    data_directory = config.SPECTATORS_DATA
    min_date = config.SPECTATORS_MIN_DATE
    max_date = config.SPECTATORS_MAX_DATE
    es_index = config.SPECTATORS_ES_INDEX
    es_doctype = config.SPECTATORS_ES_DOCTYPE
    es_settings = None

    tag_toplevel = 'article'
    tag_entry = 'content'

    # New data members
    filename_pattern = re.compile('[a-zA-z]+_(\d+)_(\d+)')
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start=min_date, end=max_date):
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

    overview_fields = ['magazine', 'issue', 'date', 'title', 'editor']

    fields = [
        Field(
            name='date',
            display_name='Date',
            description='Publication date.',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            term_frequency=True,
            results_overview=True,
            search_filter=filters.DateFilter(
                config.SPECTATORS_MIN_DATE,
                config.SPECTATORS_MAX_DATE,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=extract.XML(tag='date', toplevel=True),
            csv_core=True
        ),
        Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the entry.',
            extractor=extract.Combined(
                extract.XML(tag='magazine', toplevel=True),
                extract.Metadata('year'),
                extract.Metadata('issue'),
                transform=lambda x: '_'.join(x),
            ),
        ),
        Field(
            name='issue',
            display_name='Issue number',
            es_mapping={'type': 'integer'},
            description='Source issue number.',
            results_overview=True,
            extractor=extract.XML(tag='issue', toplevel=True),
            csv_core=True,
        ),
        Field(
            name='magazine',
            display_name='Magazine name',
            term_frequency=True,
            results_overview=True,
            es_mapping={'type': 'keyword'},
            description='Magazine name.',
            search_filter=filters.MultipleChoiceFilter(
                description='Search only within these magazines.',
                options=sorted(['De Hollandsche Spectator', 'De Denker']),
            ),
            extractor=extract.XML(tag='magazine', toplevel=True),
            csv_core=True
        ),
        Field(
            name='editors',
            display_name='Editors',
            description='Magazine editor(s).',
            extractor=extract.XML(tag='editor', toplevel=True, multiple=True)
        ),
        Field(
            name='title',
            display_name='Title',
            results_overview=True,
            description='Article title.',
            extractor=extract.XML(tag='title', toplevel=True),
            search_field_core=True
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            results_overview=True,
            extractor=extract.XML(tag='text', multiple=True, flatten=True),
            search_field_core=True
        ),
    ]
