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
import base64

from flask import current_app, url_for

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
    image = current_app.config['PERIODICALS_IMAGE']
    scan_image_type = current_app.config['PERIODICALS_SCAN_IMAGE_TYPE']
    description_page = current_app.config['PERIODICALS_DESCRIPTION_PAGE']

    tag_toplevel = 'articles'
    tag_entry = 'artInfo'

    # New data members
    filename_pattern = re.compile('[a-zA-z]+_(\d+)_(\d+)')
    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    mimetype = 'image/jpeg'

    def sources(self, start=min_date, end=max_date):
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
                metadict['date'] = datetime.strptime(date, '%B %d, %Y').strftime('%Y-%m-%d')
            # the star upacks the list as an argument list
            metadict['image_path'] = join(*row[2].split("\\")).strip()
            ext_filename = join(self.data_directory, join(*row[3].split("\\")), row[4])
            issueid = row[4].split("_")[0]
            metadict['issue_id'] = issueid
            xmlfile = issueid + "_Text.xml"
            metadict['external_file'] = ext_filename
            filename = join(self.data_directory, join(*row[3].split("\\")), xmlfile)
            if not isfile(filename):
                print("File {} not found".format(filename))
                continue
            yield filename, metadict

    fields = [
        Field(
            name='date',
            display_name='Formatted Date',
            description='Publication date, formatted from the full date',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            term_frequency=True,
            search_filter=filters.DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=extract.Metadata('date'),
            csv_core=True,
            visualization_type='timeline'
        ),
        Field(
            name='date_pub',
            display_name='Publication Date',
            description='Publication date as full string, as found in source file',
            results_overview=True,
            extractor=extract.Metadata('date_full')
        ),
        Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the entry.',
            extractor=extract.XML(tag=None,
                                  toplevel=False,
                                  attribute='id'),
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
                option_count=90
            ),
            extractor=extract.Metadata('title'),
            csv_core=True,
            visualization_type='term_frequency'
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            results_overview=True,
            extractor=extract.XML(tag='ocrText', flatten=True),
            search_field_core=True,
            visualization_type="wordcloud"
        ),
        Field(
            name='ocr',
            display_name='OCR confidence',
            description='OCR confidence level.',
            es_mapping={'type': 'float'},
            search_filter=filters.RangeFilter(0, 100,
                                              description=(
                                                  'Accept only articles for which the Opitical Character Recognition confidence '
                                                  'indicator is in this range.'
                                              )
                                              ),
            extractor=extract.XML(tag='ocr',
                external_file={
                    'xml_tag_toplevel': 'issue',
                    'xml_tag_entry': 'article'
                },
                secondary_tag = {
                    'tag': 'id',
                    'match': 'id'
                }
            ),
            sortable=True
        ),
        Field(
            name='title',
            display_name='Article title',
            description='Title of the article.',
            extractor=extract.XML(tag='ti',
                external_file={
                    'xml_tag_toplevel': 'issue',
                    'xml_tag_entry': 'article'
                },
                secondary_tag = {
                    'tag': 'id',
                    'match': 'id'
                }
            ),
            visualization_type='wordcloud'
        ),
        Field(
            name='start_column',
            display_name='Starting column',
            description='Which column the article starts in.',
            extractor=extract.XML(tag='sc',
                external_file={
                    'xml_tag_toplevel': 'issue',
                    'xml_tag_entry': 'article'
                },
                secondary_tag = {
                    'tag': 'id',
                    'match': 'id'
                }
            )
        ),
        Field(
            name='page_count',
            display_name='Page count',
            description='How many pages the article covers.',
            es_mapping={'type': 'integer'},
            extractor=extract.XML(tag='pc',
                external_file={
                    'xml_tag_toplevel': 'issue',
                    'xml_tag_entry': 'article'
                },
                secondary_tag = {
                    'tag': 'id',
                    'match': 'id'
                }
            )
        ),
        Field(
            name='word_count',
            display_name='Word count',
            description='Number of words in the article.',
            es_mapping={'type': 'integer'},
            extractor=extract.XML(tag='wordCount',
                external_file={
                    'xml_tag_toplevel': 'issue',
                    'xml_tag_entry': 'article'
                },
                secondary_tag = {
                    'tag': 'id',
                    'match': 'id'
                }
            )
        ),
        Field(
            name='category',
            display_name='Category',
            description='Article category.',
            es_mapping={'type': 'keyword'},
            extractor=extract.XML(tag='ct',
                external_file={
                    'xml_tag_toplevel': 'issue',
                    'xml_tag_entry': 'article'
                },
                secondary_tag = {
                    'tag': 'id',
                    'match': 'id'
                }
            ),
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in these categories.',
                option_count=26
            ),
            visualization_type='term_frequency'
        ),
        Field(
            name='page_no',
            display_name='Page number',
            description='At which page the article starts.',
            extractor=extract.XML(tag='pa',
                parent_level=1,
                external_file={
                    'xml_tag_toplevel': 'issue',
                    'xml_tag_entry': 'article'
                },
                secondary_tag = {
                    'tag': 'id',
                    'match': 'id'
                },
                transform=lambda x: re.sub('[\[\]]', '', x)
            )
        ),
        Field(
            name='image_path',
            display_name='Image path',
            es_mapping={'type': 'keyword'},
            description='Path of scan.',
            extractor=extract.Metadata('image_path'),
            hidden=True
        ),
    ]

    def request_media(self, document):
        field_vals = document['fieldValues']
        image_directory = field_vals['image_path']
        starting_page = field_vals['id'][:-4]
        start_index = int(starting_page.split("-")[-1])
        page_count = int(field_vals['page_count'])
        image_list = []
        for page in range(page_count):
            page_no = str(start_index + page).zfill(4)
            image_name = '{}-{}.JPG'.format(starting_page[:-5], page_no)
            if isfile(join(self.data_directory, image_directory, image_name)):
                image_list.append(url_for('api.api_get_media', 
                    corpus=self.es_index,
                    image_path=join(image_directory, image_name),
                    _external=True
                ))
            else:
                continue
        return image_list
