from datetime import datetime
import os
from os.path import join, splitext


from django.conf import settings
from addcorpus.python_corpora.corpus import HTMLCorpusDefinition, FieldDefinition
from addcorpus.python_corpora.extract import Metadata, XML, Pass, Order, Backup, Combined, FilterAttribute
from addcorpus.es_mappings import *
from addcorpus.python_corpora.filters import RangeFilter, MultipleChoiceFilter, BooleanFilter, DateFilter
from addcorpus.es_settings import es_settings


from ianalyzer_readers.readers.html import HTMLReader
from ianalyzer_readers.readers.core import Field
from ianalyzer_readers.extract import html, Constant

import locale
locale.setlocale(locale.LC_ALL, 'nl_NL.UTF-8')

class UBlad(HTMLCorpusDefinition):
    title = 'U-Blad'
    description = 'The print editions of the Utrecht University paper from 1969 until 2010.'
    description_page = 'ublad.md'
    min_date = datetime(year=1969, month=1, day=1)
    max_date = datetime(year=2010, month=12, day=31)

    data_directory = settings.UBLAD_DATA
    es_index = getattr(settings, 'UBLAD_ES_INDEX', 'ublad')
    image = 'ublad.jpg'
    citation_page = 'citation.md'
    scan_image_type = getattr(settings, 'UBLAD_SCAN_IMAGE_TYPE', 'image/jpeg')
    allow_image_download = getattr(settings, 'UBLAD_ALLOW_IMAGE_DOWNLOAD', True)

    languages = ['nl']
    category = 'periodical'

    @property
    def es_settings(self):
        return es_settings(self.languages[:1], stopword_analysis=True, stemming_analysis=True)

    def sources(self, start=min_date, end=max_date):
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                if filename != '.DS_Store':
                    full_path = join(directory, filename)
                    yield full_path, {'filename': filename}


    fields = [
        FieldDefinition(
            name = 'content',
            display_name='Content',
            display_type='text_content',
            results_overview=True,
            csv_core=True,
            search_field_core=True,
            visualisations=['ngram', 'wordcloud'],
            es_mapping = main_content_mapping(True, True, True, 'nl'),
            extractor= FilterAttribute(tag='div', recursive=True, multiple=False, flatten=True, attribute_filter={
                'attribute': 'class',
                'value': 'ocr_page'
            })
        ),
        FieldDefinition(
            name='pagenum',
            display_name='Page number',
            description='Page number',
            es_mapping = int_mapping(),
            extractor = FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'pagenum'
                }
            )
        ),

        FieldDefinition(
            name='journal_title',
            display_name='Publication Title',
            description='Title of the publication',
            extractor = FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'journal_title'
                }
            )
        ),
        FieldDefinition(
            name='volume_id',
            display_name='Volume ID',
            description='Unique identifier for this volume',
            hidden=True,
            extractor = FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'identifier_ocn'
                }
            )
        ),
        FieldDefinition(
            name='page_id',
            display_name='Page ID',
            description='Unique identifier for this page',
            hidden=True,
            extractor = FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'identifier_indexid'
                }
            )
        ),
        FieldDefinition(
            name='edition',
            display_name='Edition',
            description='The number of the edition in this volume. Every year starts at 1.',
            sortable=True,
            extractor = FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'aflevering'
                }
            )
        ),
        FieldDefinition(
            name='volume',
            display_name='Volume',
            sortable=True,
            results_overview=True,
            description='The volume number of this publication. There is one volume per year.',
            extractor = FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'yearstring'
                }
            ),
        ),
        FieldDefinition(
            name='date',
            display_name='Date',
            description='The publication date of this edition',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            visualizations=['resultscount', 'termfrequency'],
            sortable=True,
            results_overview=True,
            search_filter=DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor = FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'datestring',
                },
                transform=lambda x: datetime.strptime(
                    x, '%d %B %Y').strftime('%Y-%m-%d')
            )
        ),
        FieldDefinition(
            name='repo_url',
            display_name='Repository URL',
            description='URL to the dSPACE repository entry of this volume',
            es_mapping=keyword_mapping(),
            searchable=False,
            extractor=FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'link_repository'
                }
            )
        ),
        FieldDefinition(
            name='reader_url',
            display_name='Reader URL',
            description='URL to the UB reader view of this page',
            es_mapping=keyword_mapping(),
            searchable=False,
            extractor=FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'link_objects_image'
                }
            )
        ),
        FieldDefinition(
            name='jpg_url',
            display_name='Image URL',
            description='URL to the jpg file of this page',
            es_mapping=keyword_mapping(),
            searchable=False,
            extractor=FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'link_objects_jpg'
                }
            )
        ),
        FieldDefinition(
            name='worldcat_url',
            display_name='Worldcat URL',
            description='URL to the Worldcat entry of this volume',
            es_mapping=keyword_mapping(),
            searchable=False,
            extractor=FilterAttribute(tag='meta', attribute='content', attribute_filter={
                'attribute': 'name',
                'value': 'link_worldcat'
                }
            )
        )
    ]

    def request_media(self, document, corpus_name):
        image_list = [document['fieldValues']['jpg_url']]
        return {'media': image_list}
