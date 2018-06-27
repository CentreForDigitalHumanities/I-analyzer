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


class DutchNewspapers(XMLCorpus):
    title = config.DUTCHNEWSPAPERS_TITLE
    description = config.DUTCHNEWSPAPERS_DESCRIPTION
    data_directory = config.DUTCHNEWSPAPERS_DATA
    min_date = config.DUTCHNEWSPAPERS_MIN_DATE
    max_date = config.DUTCHNEWSPAPERS_MAX_DATE
    es_index = config.DUTCHNEWSPAPERS_ES_INDEX
    es_doctype = config.DUTCHNEWSPAPERS_ES_DOCTYPE
    es_settings = None

    xml_tag_toplevel = 'text'
    xml_tag_entry = 'p'

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
                if filename != '.DS_Store':
                    name, extension = splitext(filename)
                    full_path = join(directory, filename)
                    if extension != '.xml':
                        logger.debug(self.non_xml_msg.format(full_path))
                        continue
                    def_match = self.definition_pattern.match(name)
                    article_match = self.article_pattern.match(name)
                    if def_match:
                        d.append((full_path, {'file_tag': 'definition'}))
                    if article_match:
                        id = os.path.basename(os.path.dirname(full_path)) + article_match.group(1)
                        d.append((full_path, {'id': id}))
            if d != []:
                yield d

    fields = [
        Field(
            name='date',
            display_name='Date',
            description='Publication date.',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            term_frequency=True,
            prominent_field=True,
            search_filter=filters.DateFilter(
                config.TIMES_MIN_DATE,
                config.TIMES_MAX_DATE,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=extract.XML(  tag='date',
                                    toplevel=True,
                                    recursive=True, 
                                    external_file={
                                        'file_tag': 'definition',
                                        'xml_tag_toplevel': 'DIDL', 
                                        'xml_tag_entry': 'Item'
                                        }
                                    )
        ),
        Field(
            name='newspaper_title',
            display_name='Newspaper title',
            description='Title of the newspaper',
            prominent_field=True,
            extractor=extract.XML(  tag='title',
                                    toplevel=True,
                                    recursive=True, 
                                    external_file={
                                        'file_tag': 'definition',
                                        'xml_tag_toplevel': 'DIDL', 
                                        'xml_tag_entry': 'Item'
                                        }
                                    )
        ),
        Field(
            name='issue_number',
            display_name='Issue number',
            description='Issue number of the newspaper',
            prominent_field=True,
            extractor=extract.XML(  tag='issuenumber',
                                    toplevel=True,
                                    recursive=True, 
                                    external_file={
                                        'file_tag': 'definition',
                                        'xml_tag_toplevel': 'DIDL', 
                                        'xml_tag_entry': 'Item'
                                        }
                                    )
        ),
        Field(
            name='publisher',
            display_name='Publisher',
            description='Publisher',
            extractor=extract.XML(  tag='publisher',
                                    toplevel=True,
                                    multiple=True,
                                    flatten=True,
                                    recursive=True, 
                                    external_file={ 
                                        'file_tag': 'definition',
                                        'xml_tag_toplevel': 'DIDL', 
                                        'xml_tag_entry': 'Item'
                                        }
                                    )
        ),
        Field(
            name='language',
            display_name='Language',
            description='language',
            extractor=extract.XML(  tag='language',
                                    toplevel=True,
                                    recursive=True, 
                                    external_file={ 
                                        'file_tag': 'definition',
                                        'xml_tag_toplevel': 'DIDL', 
                                        'xml_tag_entry': 'Item'
                                        }
                                    )
        ),
        Field(
            name='article_title',
            display_name='Article title',
            description='Article title',
            prominent_field=True,
            extractor=extract.XML(tag='title', flatten=True, toplevel=True)
        ),
        Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the entry.',
            extractor=extract.Metadata('id')
        ),
        Field(
            name='source',
            display_name='Source',
            description='Source.',
            extractor=extract.XML(  tag='source',
                                    toplevel=True,
                                    recursive=True, 
                                    external_file={
                                        'file_tag': 'definition',
                                        'xml_tag_toplevel': 'DIDL', 
                                        'xml_tag_entry': 'Item'
                                        }
                                    )
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            prominent_field=True,
            extractor=extract.XML(tag='p', multiple=True, flatten=True, toplevel=True)
        ),
    ]

if __name__ == '__main__':
    c = DutchNewspapers()
    d = c.documents()

    print(next(d))
