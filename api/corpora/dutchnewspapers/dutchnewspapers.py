'''
Collect corpus-specific information, that is, data structures and file
locations.
'''

from pprint import pprint
import random
import re
from datetime import datetime, timedelta
from os.path import join, dirname, isfile, splitext
import os
import logging

from flask import current_app

from addcorpus.corpus import XMLCorpus, Field, until, after, string_contains
from addcorpus import filters
from addcorpus.extract import Combined, Metadata, XML

logger = logging.getLogger(__name__)


# Source files ################################################################


class DutchNewspapers(XMLCorpus):
    title = "Dutch Newspapers"
    description = "Collection of Dutch newspapers by the KB"
    min_date = datetime(year=1600, month=1, day=1)
    max_date = datetime(year=2018, month=12, day=31)
    data_directory = current_app.config['DUTCHNEWSPAPERS_DATA']
    es_index = current_app.config['DUTCHNEWSPAPERS_ES_INDEX']
    es_doctype = current_app.config['DUTCHNEWSPAPERS_ES_DOCTYPE']
    es_settings = None
    image = current_app.config['DUTCHNEWSPAPERS_IMAGE']

    tag_toplevel = 'text'
    tag_entry = 'p'

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
            definition_file = next((join(directory, filename) for filename in filenames if 
                                self.definition_pattern.match(filename)),None)
            if not definition_file:
                continue
            for filename in filenames:
                if filename != '.DS_Store':
                    name, extension = splitext(filename)
                    full_path = join(directory, filename)
                    if extension != '.xml':
                        logger.debug(self.non_xml_msg.format(full_path))
                        continue
                    #def_match = self.definition_pattern.match(name)
                    article_match = self.article_pattern.match(name)
                    if article_match:
                        identifier = os.path.basename(os.path.dirname(
                            full_path)) + article_match.group(1)
                        record_id = identifier[4:-4].replace("_",":") +\
                          ":a" + identifier[-4:]
                        # still need to insert ":a" after "mpeg21"
                        yield full_path, {
                            'external_file': definition_file,
                            'id': record_id
                        }
    
    titlefile = join(dirname(current_app.config['CORPORA']['dutchnewspapers']), current_app.config['DUTCHNEWSPAPERS_TITLES'])
    with open(titlefile) as f:
        papers = f.readlines()

    distribution = {
        'Landelijk': 'National',
        'Nederlands-Indië / Indonesië': 'Dutch East Indies/Indonesia',
        'Nederlandse Antillen': 'Netherlands Antilles',
        'Regionaal/lokaal': 'Regional/local',
        'Suriname': 'Surinam',
        'Verenigde Staten': 'United States of America',
        'onbekend': 'unknown',
    }

    fields = [
        # Field(
        #     name="url",
        #     display_name="Delpher URL",
        #     description="Link to record on Delpher",
        #     extractor=Combined(
        #         Metadata(key="id"),
        #         XML(tag='identifier',
        #             toplevel=True,
        #             recursive=True,
        #             external_file={
        #                 'file_tag': 'definition',
        #                 'xml_tag_toplevel': 'DIDL',
        #                 'xml_tag_entry': 'Item'
        #             })
        #     )
        # ),
        Field(
            name='date',
            display_name='Date',
            description='Publication date.',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            results_overview=True,
            csv_core=True,
            visualization_type='timeline',
            search_filter=filters.DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=XML(tag='date',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  },
                                  transform=lambda x: str(x)
                                  )
        ),
        Field(
            name='newspaper_title',
            display_name='Newspaper title',
            description='Title of the newspaper',
            results_overview=True,
            search_field_core=True,
            es_mapping={'type': 'keyword'},
            visualization_type='term_frequency',
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in these newspapers.',
                options=papers
            ),
            extractor=XML(tag='title',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='version_of',
            display_name='Version of',
            description='The newspaper is a version of this newspaper.',
            es_mapping={'type': 'keyword'},
            extractor=XML(tag='isVersionOf',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='issue_number',
            display_name='Issue number',
            description='Issue number of the newspaper',
            csv_core=True,
            es_mapping={'type': 'integer'},
            extractor=XML(tag='issuenumber',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='category',
            display_name='Category',
            description='Whether the item is an article, advertisment, etc.',
            csv_core=True,
            es_mapping={'type': 'keyword'},
            extractor=XML(tag='subject',
                                  toplevel=False,
                                  recursive=True,
                                  multiple=False,
                                  secondary_tag={
                                      'tag': 'recordIdentifier',
                                      'match': 'id'
                                  },
                                  external_file={
                                      'xml_tag_toplevel': 'Item',
                                      'xml_tag_entry': 'dcx'
                                  }
                                  )
        ),
        Field(
            name='circulation',
            display_name='Circulation',
            description='The area in which the newspaper was distributed.',
            es_mapping={'type': 'keyword'},
            csv_core=True,
            extractor=XML(tag='spatial',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='publisher',
            display_name='Publisher',
            description='Publisher',
            search_field_core=True,
            extractor=XML(tag='publisher',
                                  toplevel=True,
                                  multiple=True,
                                  flatten=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='language',
            display_name='Language',
            description='language',
            es_mapping={'type': 'keyword'},
            visualization_type='term_frequency',
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in these newspapers.',
                options=['nl', 'fr']
            ),
            extractor=XML(tag='language',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='article_title',
            display_name='Article title',
            description='Article title',
            results_overview=True,
            search_field_core=True,
            extractor=XML(tag='title', flatten=True, toplevel=True)
        ),
        Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the entry.',
            extractor=Metadata('id')
        ),
        Field(
            name='source',
            display_name='Source',
            description='Library or archive which keeps the hard copy of this newspaper.',
            es_mapping={'type': 'keyword'},
            extractor=XML(tag='source',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='pub_place',
            display_name='Publication Place',
            description='Where the newspaper was published',
            es_mapping={'type': 'keyword'},
            extractor=XML(tag='spatial',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'yearsDigitized'
                                  }
                                )
        ),
        Field(
            name='spatial',
            display_name='Distribution',
            description='Distribution area of the newspaper.',
            results_overview=True,
            csv_core=True,
            es_mapping={'type': 'keyword'},
            visualization_type='term_frequency',
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in newspapers with this distribution area.',
                options=list(distribution.keys())
            ),
            extractor=XML(tag='spatial',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  },
                                  )
        ),
        Field(
            name='temporal',
            display_name='Publication frequency',
            description='publication frequency of the newspaper.',
            results_overview=True,
            csv_core=True,
            es_mapping={'type': 'keyword'},
            visualization_type='term_frequency',
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in newspapers with this publication frequency.',
                options=['Dag', 'Week', 'Maand'],
            ),
            extractor=XML(tag='temporal',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  },
                                  )
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            results_overview=True,
            search_field_core=True,
            extractor=XML(tag='p', multiple=True,
                                  flatten=True, toplevel=True)
        ),
    ]
