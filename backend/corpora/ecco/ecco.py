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

    data_directory = '/Users/3248526/corpora/18th_century_collections_online/XML'
    es_index = 'ecco'
    es_index = 'article'
    image = 'ecco.jpg'

    tag_toplevel = 'book'
    tag_entry = 'book'

    meta_pattern = re.compile('^\d+\_DocMetadata\.xml$')

    def sources(self):
        logging.basicConfig(filename='ecco.log', level=logging.INFO)

        for directory, subdirs, filenames in os.walk(self.data_directory):
            _body, tail = split(directory)
            if tail.startswith('.'):
                subdits[:] = []
                continue
            # text_file = next((join(directory, filename) for filename in filenames if
            #                   self.text_pattern.search(filename)), None)
            # if not text_file:
            #     continue
            # else:
            #     print(text_file)
            #     continue

            for filename in filenames:
                if filename != '.DS_Store':
                    name, extension = splitext(filename)
                    full_path = join(directory, filename)
                    if extension != '.xml':
                        # TODO: change to logger
                        logging.debug(self.non_xml_msg.format(full_path))
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

                        # meta_dict = {
                        #     'external_file': join(directory, text_filepath),
                        #     'id': record_id
                        # }

                        meta_tags = [
                            'ocr',
                            'reel'
                        ]

                        meta_dict = self.metadata_from_xml(
                            full_path, tags=meta_tags)

                        yield(text_filepath, meta_dict)

    @property
    def fields(self):
        return [
            # Field(
            #     name='date',
            #     display_name='Date',
            #     description='Publication date.',
            #     es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            #     results_overview=True,
            #     csv_core=True,
            #     visualization_type='timeline',
            #     search_filter=filters.DateFilter(
            #         self.min_date,
            #         self.max_date,
            #         description=(
            #             'Accept only articles with publication date in this range.'
            #         )
            #     ),
            #     extractor=Metadata('date')
            # ),
            # Field(
            #     name='content',
            #     display_name='Content',
            #     display_type='text_content',
            #     description='Text content.',
            #     results_overview=True,
            #     search_field_core=True,
            #     extractor=XML(tag='p', multiple=True,
            #                   flatten=True, toplevel=True),
            #     visualization_type="word_cloud"
            # ),

            # Field(
            #     name='content',
            #     display_name='Content',
            #     display_type='text_content',
            #     description='Text content.',
            #     results_overview=True,
            #     search_field_core=True,
            #     extractor=XML(tag='ocrText',
            #                   toplevel=False,
            #                   recursive=False,
            #                   multiple=True,
            #                   #   secondary_tag={
            #                   #       'tag': 'recordIdentifier',
            #                   #       'match': 'id'
            #                   #   },
            #                   external_file={
            #                       'xml_tag_toplevel': 'pageContent',
            #                       'xml_tag_entry': 'pageContent'
            #                   }
            #                   ),
            #     visualization_type="word_cloud"
            # )
        ]


if __name__ == '__main__':

    c = Ecco()
    ss = list(c.sources())
