'''
Collect corpus-specific information, that is, data structures and file
locations.
'''
import os
from os.path import join, isfile, split, splitext
from datetime import datetime, timedelta
import logging
import re
from io import BytesIO

from flask import current_app, url_for

from addcorpus.extract import Combined, Metadata, XML
from addcorpus import filters
from addcorpus.corpus import XMLCorpus, Field, consolidate_start_end_years, string_contains
from addcorpus.image_processing import get_pdf_info, retrieve_pdf, pdf_pages, build_partial_pdf


# Source files ################################################################


class Ecco(XMLCorpus):
    title = "Eighteenth Century Collections Online"
    description = "Digital collection of books published in Great Britain during the 18th century."
    min_date = datetime(year=1700, month=1, day=1)
    max_date = datetime(year=1800, month=12, day=31)

    data_directory = current_app.config['ECCO_DATA']
    es_index = current_app.config['ECCO_ES_INDEX']
    es_doctype = current_app.config['ECCO_ES_DOCTYPE']
    image = current_app.config['ECCO_IMAGE']
    scan_image_type = current_app.config['ECCO_SCAN_IMAGE_TYPE']
    es_settings = None

    tag_toplevel = 'pageContent'
    tag_entry = 'page'

    meta_pattern = re.compile('^\d+\_DocMetadata\.xml$')

    def sources(self, start=min_date, end=max_date):
        logging.basicConfig(filename='ecco.log', level=logging.INFO)

        for directory, subdirs, filenames in os.walk(self.data_directory):
            _body, tail = split(directory)
            if tail.startswith('.'):
                subdirs[:] = []
                continue
            elif tail.startswith('ECCOI'):
                category = tail[6:]

            for filename in filenames:
                if not filename.startswith('.'):
                    name, extension = splitext(filename)
                    full_path = join(directory, filename)
                    if extension != '.xml':
                        # TODO: change to logger
                        #logging.debug(self.non_xml_msg.format(full_path))
                        continue

                    # text_match = self.text_pattern.match(filename)
                    meta_match = self.meta_pattern.match(filename)

                    if meta_match:
                        record_id = name.split('_')[0]
                        text_filepath = join(
                            directory, '{}_PageText.xml'.format(record_id))
                        if not isfile(text_filepath):
                            logging.warning(
                                '{} is not a file'.format(text_filepath))
                            continue

                        meta_tags = [
                            'collation',
                            {'tag': 'author', 'subtag': 'composed'},
                            {'tag': 'holdings', 'subtag': 'libraryName', 'list': True},
                            'fullTitle',
                            'imprintFull',
                            {'tag': 'sourceLibrary', 'subtag': 'libraryName'},
                            'ocr',
                            'pubDateStart',
                            'publicationPlaceComposed',
                            'Volume'
                        ]

                        meta_dict = self.metadata_from_xml(
                            full_path, tags=meta_tags)
                        meta_dict['id'] = record_id
                        meta_dict['category'] = category
                        parts = directory.split('/')
                        image_dir = join('/', join(*parts[:-3]),'Images', parts[-1], parts[-2])
                        meta_dict['image_dir'] = image_dir

                        yield(text_filepath, meta_dict)

    @property
    def fields(self):
        return [
            Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the entry.',
            extractor=Combined(Metadata('id'),
            XML(attribute='id'),
            transform=lambda x: '_'.join(x))
        ),
            Field(
                name='year',
                display_name='Year',
                description='Publication year.',
                es_mapping={'type': 'integer'},
                results_overview=True,
                csv_core=True,
                visualizations=['histogram'],
                visualization_sort='key',
                search_filter=filters.RangeFilter(
                    1700,
                    1800,
                    description=(
                        'Accept only book pages with publication year in this range.'
                    )
                ),
                extractor=Metadata('pubDateStart', transform=lambda x: x[:4])
            ),
            Field(
                name='title',
                display_name='Title',
                description='The title of the book',
                extractor=Metadata('fullTitle'),
                es_mapping={'type': 'keyword'},
                results_overview=True,
                search_field_core=True,
                csv_core=True,
                search_filter=filters.MultipleChoiceFilter(
                    description="Accept only pages from these books",
                    option_count=1000
                ),
                visualizations=['wordcloud']
            ),
            Field(
                name='content',
                display_name='Content',
                display_type='text_content',
                description='Text content.',
                results_overview=True,
                search_field_core=True,
                extractor=XML(tag='ocrText',
                              flatten=True),
                visualizations=['wordcloud']
            ),
            Field(
                name='ocr',
                display_name='OCR quality',
                description='Optical character recognition quality',
                extractor=Metadata('ocr'),
                es_mapping={'type': 'float'},
                search_filter=filters.RangeFilter(
                    0,
                    100,
                    description=(
                        'Accept only book pages for which the Opitical Character Recognition '
                        'confidence indicator is in this range.'
                    )
                ),
            ),
            Field(
                name='author',
                display_name='Author',
                description='The author of the book',
                es_mapping={'type': 'keyword'},
                results_overview=True,
                csv_core=True,
                extractor=Metadata('author'),
                search_field_core=True,
                search_filter=filters.MultipleChoiceFilter(
                    description='Accept only book pages by these authors.',
                    option_count=1000
                )
            ),
            Field(
                name='page',
                display_name='Page number',
                description='Number of the page on which match was found',
                extractor=XML(attribute='id', transform=lambda x: int(int(x)/10))
            ),
            Field(
                name='pub_place',
                display_name='Publication place',
                description='Where the book was published',
                extractor=Metadata('publicationPlaceComposed')
            ),
            Field(
                name='collation',
                display_name='Collation',
                description='Information about the volume',
                extractor=Metadata('collation')
            ),
            Field(
                name='category',
                display_name='Category',
                description='Which category this book belongs to',
                extractor=Metadata('category'),
                es_mapping={'type': 'keyword'},
                search_filter=filters.MultipleChoiceFilter(
                    description='Accept only book pages in these categories.',
                    option_count=7
                ),
                visualizations=['histogram']
            ),
            Field(
                name='imprint',
                display_name='Printer',
                description='Information of the printer and publisher of the book',
                extractor=Metadata('imprintFull')
            ),
            Field(
                name='library',
                display_name='Source library',
                description='The source library of the book',
                extractor=Metadata('sourceLibrary')
            ),
            Field(
                name='holdings',
                display_name='Holding libraries',
                description='Libraries holding a copy of the book',
                extractor=Metadata('holdings')
            ),
            Field(
                name='volume',
                display_name='Volume',
                description='The book volume',
                extractor=Metadata('Volume')
            ),
            Field(
                name='image_path',
                hidden=True,
                extractor=Combined(Metadata('image_dir'), Metadata('id'), transform=lambda x: '/'.join(x))
            )
        ]


    def request_media(self, document):
        image_path = document['fieldValues']['image_path']
        pages_returned = 5 #number of pages that is displayed. must be odd number.
         #the page corresponding to the document
        home_page = int(document['fieldValues']['page'])
        pdf_info = get_pdf_info(join(self.data_directory, image_path))
        pages, home_page_index = pdf_pages(pdf_info['all_pages'], pages_returned, home_page)
        pdf_info = {
            "pageNumbers": [p for p in pages], #change from 0-indexed to real page
            "homePageIndex": home_page_index+1, #change from 0-indexed to real page
            "fileName": pdf_info['filename'],
            "fileSize": pdf_info['filesize']
        }
        image_url = url_for('api.api_get_media',
            corpus=self.es_index,
            image_path=image_path,
            start_page=pages[0]-1,
            end_page=pages[-1],
            _external=True
        )
        return {'media': [image_url], 'info': pdf_info}


    def get_media(self, request_args):
        '''
        Given the image path and page number of the search result,
        construct a new pdf which contains 2 pages before and after.
        '''
        image_path = request_args['image_path']
        start_page = int(request_args['start_page'])
        end_page = int(request_args['end_page'])
        absolute_path = join(self.data_directory, image_path)
        if not isfile(absolute_path):
            return None
        input_pdf = retrieve_pdf(absolute_path)
        pages = range(start_page, end_page)
        out = build_partial_pdf(pages, input_pdf)
        return out
