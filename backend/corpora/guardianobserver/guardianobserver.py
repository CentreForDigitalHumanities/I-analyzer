'''
Collect information from the Guardian-Observer corpus: the articles are contained in 
separate xml-files, zipped.
'''

import logging
logger = logging.getLogger(__name__)
import glob
from pathlib import Path # needed for Python 3.4, as glob does not support recursive argument
import os.path as op
from datetime import date, datetime
from zipfile import ZipFile

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

    tag_toplevel = 'Record'

    def sources(self, start=datetime.min, end=datetime.max):
        '''
        Obtain source files for the Guardian-Observer data.

        Specifically, return the data contained in an xml file within a zip archive.
        '''
        for zfile in Path(self.data_directory).glob('**/GO_*.zip'):
            xmls = ZipFile(str(zfile)).namelist()
            with ZipFile(str(zfile), mode='r') as zipped:
                for xml in xmls:
                    with zipped.open(xml) as xmlfile:
                        data = xmlfile.read()
                    yield data

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
                transform=lambda x: '{y}-{m}-{d}'.format(y=x[:4],m=x[4:6],d=x[6:])
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
            extractor=extract.XML(tag='RecordID', toplevel=True)
        ),
        Field(
            name='pub_id',
            display_name='Publication ID',
            description='Publication identifier',
            extractor=extract.XML(tag='PublicationID', toplevel=True, recursive=True)
        ),
        Field(
            name='page',
            display_name='Page',
            description='Start page label, from source (1, 2, 17A, ...).',
            extractor=extract.XML(tag='StartPage', toplevel=True)
        ),
        Field(
            name='title',
            display_name='Title',
            search_field_core=True,
            visualization_type='wordcloud',
            description='Article title.',
            extractor=extract.XML(tag='RecordTitle', toplevel=True)
        ),
        Field(
            name='source-paper',
            display_name='Source paper',
            description='Credited as source.',
            extractor=extract.XML(tag='Title', toplevel=True)
        ),
        Field(
            name='place',
            display_name='Place',
            description='Place in which the article was published',
            extractor=extract.XML(tag='Qualifier', toplevel=True)
        ),
        Field(
            name='author',
            display_name='Author',
            description='Article author',
            extractor=extract.XML(tag='PersonName', toplevel=True)
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
                    'default',
                    'options'
                ]
            ),
            extractor=extract.XML(tag='ObjectType', toplevel=True),
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
            extractor=extract.XML(tag='FullText', toplevel=True)
        )
    ]