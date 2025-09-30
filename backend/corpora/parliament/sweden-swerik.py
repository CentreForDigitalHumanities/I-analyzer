from datetime import date
import os
import glob
from django.conf import settings
from ianalyzer_readers.readers.xml import XMLReader
from ianalyzer_readers.extract import Constant

from corpora.parliament.parliament import Parliament
from corpora.parliament.utils import field_defaults


class ParliamentSwedenSwerik(Parliament, XMLReader):
    title = 'People & Parliament (Sweden, Swerik dataset)'
    description = 'Speeches from the Riksdag. This corpus is based on the Swedish' \
        'Parliament Corpus published by the Swerik project.'
    min_date = date(1867, 1, 1)
    max_date = date(2000, 12, 31)

    data_directory = settings.PP_SWEDEN_SWERIK_DATA
    es_index = getattr(settings, 'PP_SWEDEN_SWERIK_INDEX', 'parliament-sweden-swerik')

    def sources(self, **kwargs):
        records_path = os.path.join(self.data_directory, 'records', 'data')
        for path in glob.glob(records_path + '/*/*.xml'):
            yield path

    country = field_defaults.country()
    country.extractor = Constant('Sweden')

    def __init__(self):
        self.fields = [self.country]
