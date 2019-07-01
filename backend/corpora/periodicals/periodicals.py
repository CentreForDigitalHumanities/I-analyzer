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
import openpyxl

from flask import current_app

from addcorpus import extract
from addcorpus import filters
from addcorpus.corpus import XMLCorpus, Field, until, after, string_contains


# Source files ################################################################


class Periodicals(XMLCorpus):
    title = "Periodicals"
    description = "A collection of 19th century periodicals"
    min_date = datetime(1800,1,1)
    max_date = datetime(1900,1,1)
    data_directory = current_app.config['PERIODICALS_DATA']
    es_index = current_app.config['PERIODICALS_ES_INDEX']
    es_doctype = current_app.config['PERIODICALS_ES_DOCTYPE']
    es_settings = None

    tag_toplevel = 'articles'
    tag_entry = 'artInfo'

    # New data members
    filename_pattern = re.compile('[a-zA-z]+_(\d+)_(\d+)')
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        metafile = join(self.data_directory, "19thCenturyUKP_NewReaderships.xlsx")
        wb = openpyxl.load_workbook(filename=metafile)
        sheet = wb['19thCenturyUKP_NewReaderships']
        for index, row in enumerate(sheet.values):
            metadict = {}
            # skip first row, and rows without date
            if index==0 or not row[1]:
                continue
            metadict['title'] = row[0]
            if row[1].startswith('['):
                date = row[1][1:-1]
            else: date = row[1]
            metadict['date_full'] = date
            if date=='Date Unknown':
                metadict['date'] = None
            else:
                metadict['date'] = datetime.strptime(date, '%B %d, %Y')
            metadict['image_path'] = join(row[2].split("\\"))
            issueid = row[4].split("_")[0]
            metadict['issue_id'] = issueid
            xmlfile = issueid + "_Text.xml"
            # the star here upacks the list as an argument list
            filename = join(self.data_directory, join(*row[3].split("\\")), xmlfile)
            if not isfile(filename):
                print(str.format("File {} not found", filename))
                continue
            yield filename, metadict

    fields = [
        Field(
            name='date',
            display_name='Date',
            description='Publication date.',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            term_frequency=True,
            results_overview=True,
            search_filter=filters.DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=extract.Metadata('date', transform=lambda x: x.strftime(
                                           '%Y-%m-%d')
                                       ),
            csv_core=True
        ),
        Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the entry.',
            extractor=extract.XML(tag='artInfo', toplevel=True),
        ),
        Field(
            name='issue',
            display_name='Issue number',
            description='Source issue number.',
            results_overview=False,
            extractor=extract.Metadata('issue_id'),
            csv_core=False,
        ),
        Field(
            name='periodical',
            display_name='Periodical name',
            term_frequency=True,
            results_overview=True,
            es_mapping={'type': 'keyword'},
            description='Periodical name.',
            search_filter=filters.MultipleChoiceFilter(
                description='Search only within these periodicals.',
                options = ['default', 'options']
            ),
            extractor=extract.Metadata('title'),
            csv_core=True
        ),
        Field(
            name='editors',
            display_name='Editors',
            description='Magazine editor(s).',
            extractor=extract.XML(tag='editor', toplevel=True, multiple=True)
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            results_overview=True,
            extractor=extract.XML(tag='ocrText', multiple=True, flatten=True),
            search_field_core=True
        ),
    ]
