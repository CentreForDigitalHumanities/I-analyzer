'''
Collect corpus-specific information, that is, data structures and file
locations.
'''
from addcorpus.extract import Combined, Metadata, XML
from addcorpus import filters
from addcorpus.corpus import XMLCorpus, Field, consolidate_start_end_years, string_contains
from flask import current_app
import os
from os.path import join, dirname, isfile, split, splitext
from datetime import datetime, timedelta
import logging
from pprint import pprint
import random
import re
import sys
sys.path.append('..')
sys.path.append('../..')


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
            # text_file = next((join(directory, filename) for filename in filenames if
            #                   self.text_pattern.search(filename)), None)
            # if not text_file:
            #     continue
            # else:
            #     print(text_file)
            #     continue

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
                            'fullTitle',
                            'imprintFull',
                            'libraryName',
                            'ocr',
                            'pubDateStart',
                            'publicationPlaceComposed',
                            'Volume'
                        ]

                        meta_dict = self.metadata_from_xml(
                            full_path, tags=meta_tags)
                        meta_dict['id'] = record_id
                        meta_dict['category'] = category

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
                es_mapping={'type': 'date', 'format': 'yyyy'},
                results_overview=True,
                csv_core=True,
                visualization_type='timeline',
                search_filter=filters.RangeFilter(
                    1700,
                    1800,
                    description=(
                        'Accept only articles with publication date in this range.'
                    )
                ),
                extractor=Metadata('pubDateStart', transform=lambda x: x[:4])
            ),
            Field(
                name='title',
                display_name='Title',
                description='The title of the book',
                extractor=Metadata('fullTitle') 
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
                visualization_type="word_cloud"
            ),
            Field(
                name='ocr',
                display_name='OCR quality',
                description='Optical character recognition quality',
                extractor=Metadata('ocr')
            ),
            Field(
                name='author',
                display_name='Author',
                description='The author of the book',
                results_overview=True,
                csv_core=True,
                extractor=Metadata('author')
            ),
            Field(
                name='page_no',
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
                extractor=Metadata('category')
            ),
            Field(
                name='imprint',
                display_name='Printer',
                description='Information of the printer and publisher of the book',
                extractor=Metadata('imprintFull')
            ),
            Field(
                name='library',
                display_name='Holding library',
                description='The main holding library of the book',
                extractor=Metadata('libraryName')
            ),
            Field(
                name='volume',
                display_name='Volume',
                description='The book volume',
                extractor=Metadata('Volume')
            )
        ]


if __name__ == '__main__':

    c = Ecco()
    ss = list(c.sources())
