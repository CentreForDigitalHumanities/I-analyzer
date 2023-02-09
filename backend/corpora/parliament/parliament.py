import logging
import os
import os.path as op

from django.conf import settings

from addcorpus.corpus import Corpus
from addcorpus.filters import MultipleChoiceFilter
import corpora.parliament.utils.field_defaults as field_defaults
from corpora.parliament.utils.constants import MIN_DATE, MAX_DATE
from addcorpus.es_settings import es_settings

class Parliament(Corpus):
    '''
    Base class for speeches in the People & Parliament project.

    This defines some shared constants and provides some core fields.
    Child corpora should add or overwrite fields depending on what data
    is available, then overwrite the `__init__` to set the `fields` property.

    Create indices (with alias 'peopleparliament') from
    the corpora specific definitions, and point the application
    to this base corpus.
    '''

    title = "People and Parliament"
    description = "Minutes from European parliaments"
    # store min_year as int, since datetime does not support BCE dates
    visualize = []
    es_index = settings.PP_ALIAS
    # scan_image_type = 'image/png'
    # fields below are required by code but not actually used
    min_date = MIN_DATE
    max_date = MAX_DATE
    image = 'parliament.jpeg'
    data_directory = 'bogus'

    language = 'english'

    @property
    def es_settings(self):
        return es_settings(self.language, stopword_analyzer=True, stemming_analyzer=True)


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

    country = field_defaults.country()
    country.search_filter = MultipleChoiceFilter(
        description='Search only in debates from selected countries',
        option_count=10
    )

    date = field_defaults.date()
    speech = field_defaults.speech()

    #define fields property so it can be set in __init__
    @property
    def fields(self):
        return self._fields

    @fields.setter
    def fields(self, value):
        self._fields = value

    def __init__(self):
        # init function specifies list of fields - should be overwritten in subclasses.
        # `fields` is specified here rather than than as a static property,
        # to accommodate subclasses like ParliamentUK and ParliamentUKRecent,
        # which should use the same fields list but may define different extractors
        # for individual fields

        self.fields = [ self.country, self.date, self.speech ]
