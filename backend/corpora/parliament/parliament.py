from datetime import datetime
import logging
import os
import os.path as op

from flask import current_app

from addcorpus.corpus import Corpus, Field
from addcorpus.extract import XML, Constant
from addcorpus.filters import DateFilter, MultipleChoiceFilter, RangeFilter


class Parliament(Corpus):
    '''
    Base class for corpora in the People & Parliament project.

    This supplies the frontend with the information it needs.
    Child corpora should only provide extractors for each field.
    Create indices (with alias 'peopleparliament') from
    the corpora specific definitions, and point the application
    to this base corpus.
    '''

    title = "People and Parliament"
    description = "Minutes from European parliaments"
    # store min_year as int, since datetime does not support BCE dates
    visualize = []
    es_index = current_app.config['PP_ALIAS']
    # scan_image_type = 'image/png'
    # fields below are required by code but not actually used
    min_date = datetime(year=1800, month=1, day=1)
    max_date = datetime(year=2021, month=12, day=31)
    image = 'parliament.jpeg'
    data_directory = 'bogus'

    # overwrite below in child class if you need to extract the (converted) transcription
    # from external files. See README.
    external_file_folder = '.'

    def sources(self, start, end):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            for filename in filenames:
                name, extension = op.splitext(filename)
                full_path = op.join(directory, filename)
                yield full_path, {
                    'filename': filename
                }

    country = Field(
        name='country',
        display_name='Country',
        description='Country in which the debate took place',
        es_mapping={'type': 'keyword'},
        search_filter=MultipleChoiceFilter(
            description='Search only in debates from selected countries',
            option_count=10
        )
    )

    date = Field(
        name='date',
        display_name='Date',
        description='The date on which the debate took place.',
        es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
        search_filter=DateFilter(
            min_date,
            max_date,
            description='Search only within this time range.'
        ),
    )

    debate = Field(
        name='debate',
        display_name='Debate',
        description='The full transcribed debate',
        es_mapping={'type': 'text'},
        results_overview=True,
        search_field_core=True,
        display_type='text_content',
        visualization_type='wordcloud',
    )

    fields = [country, date, debate]
