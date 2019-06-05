'''
Collect corpus-specific information, that is, data structures and file
locations.
'''

import logging
logger = logging.getLogger(__name__)
import glob
from pathlib import Path # needed for Python 3.4, as glob does not support recursive argument
import os.path as op
from datetime import datetime, timedelta
from zipfile import ZipFile, ZipExtFile

from flask import current_app

from addcorpus import extract
from addcorpus import filters
from addcorpus.corpus import XMLCorpus, Field, until, after, string_contains, consolidate_start_end_years


# Source files ################################################################


class GuardianObserver(XMLCorpus):
    title = "Guardian-Observer"
    description = "Newspaper archive, 1791-2003"
    min_date = datetime(year=1791, month=1, day=1)
    max_date = datetime(year=2003, month=12, day=31)
    data_directory = current_app.config['GO_DATA']
    es_index = current_app.config['GO_ES_INDEX']
    es_doctype = current_app.config['GO_ES_DOCTYPE']
    es_settings = None
    image = current_app.config['GO_IMAGE']
    scan_image_type = current_app.config['GO_SCAN_IMAGE_TYPE']
    #description_page = current_app.config['GO_DESCRIPTION_PAGE']

    tag_toplevel = 'issue'
    tag_entry = 'article'

    def sources(self, start=datetime.min, end=datetime.max):
        '''
        Obtain source files for the Guardian-Observer data.

        Specifically, return an iterator of tuples that each contain a string
        filename and a dictionary of metadata (in this case, the date).
        '''
        for zfile in Path(self.data_directory).glob('**/GO_*.zip'):
            xmls = ZipFile(str(zfile)).namelist()
            with ZipFile(str(zfile), mode='r') as zipped:
                for xml in xmls:
                    with zipped.open(xml) as xmlfile:
                        print(isinstance(xmlfile, ZipExtFile))
                        yield xmlfile

    fields = [
        Field(
            name='date',
            display_name='Publication Date',
            description='Publication date, parsed to yyyy-MM-dd format',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            hidden=True,
            visualization_type='timeline',
            search_filter=filters.DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=extract.XML(
                tag='NumericPubDate', toplevel=True, 
                transform=lambda x: datetime.datetime(
                    int(x[:4]), int(x[4:6], int(x[6:7])
                ).strftime(
                    '%Y-%m-%d'
                )
                )
            )
        ),
        Field(
            name='date-pub',
            display_name='Publication Date',
            csv_core=True,
            results_overview=True,
            description='Publication date as full string, as found in source file',
            extractor=extract.XML(
                tag='AlphaPubDate', toplevel=True
            )
        ),
        Field(
            name='id',
            display_name='ID',
            description='Article identifier.',
            extractor=extract.XML(tag='RecordID')
        ),
        Field(
            name='pub_id',
            display_name='Publication ID',
            description='Publication identifier',
            extractor=extract.XML(tag='PublicationID')
        ),
        Field(
            name='page',
            display_name='Page',
            description='Start page label, from source (1, 2, 17A, ...).',
            extractor=extract.XML(tag='StartPage')
        ),
        Field(
            name='title',
            display_name='Title',
            results_overview=True,
            search_field_core=True,
            visualization_type='wordcloud',
            description='Article title.',
            extractor=extract.XML(tag='RecordTitle')
        ),
        Field(
            name='source-paper',
            display_name='Source paper',
            description='Credited as source.',
            extractor=extract.XML(
                tag='Title'
            )
        ),
        Field(
            name='place',
            display_name='Place',
            description='Place in which the article was published',
            extractor=extract.XML(tag='Qualifier')
        ),
        Field(
            name='author',
            display_name='Author',
            description='Article author',
            extractor=extract.XML(tag='PersonName')
        ),
        Field(
            name='category',
            visualization_type='term_frequency',
            display_name='Category',
            description='Article subject categories.',
            es_mapping={'type': 'keyword'},
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in these categories.',
                options=[
                    'Classified Advertising',
                    'Display Advertising',
                    'Property',
                    'News',
                    'News in Brief',
                    'Index',
                    'Law',
                    'Politics and Parliament',
                    'Court and Social',
                    'Business and Finance',
                    'Shipping News',
                    'Stock Exchange Tables',
                    'Births',
                    'Business Appointments',
                    'Deaths',
                    'Marriages',
                    'Obituaries',
                    'Official Appointments and Notices',
                    'Editorials/Leaders',
                    'Feature Articles (aka Opinion)',
                    'Letters to the Editor',
                    'Arts and Entertainment',
                    'Reviews',
                    'Sport',
                    'Weather'
                ]
            ),
            extractor=extract.XML(tag='ObjectType'),
            csv_core=True
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            visualization_type='wordcloud',
            description='Raw OCR\'ed text (content).',
            results_overview=True,
            search_field_core=True,
            extractor=extract.XML(
                tag=['FullText']
            )
        )
    ]