from datetime import datetime
from flask import current_app
import os

from addcorpus.corpus import Corpus, CSVCorpus, XMLCorpus
from addcorpus.extract import Constant, CSV
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults

class ParliamentIrelandOld(CSVCorpus):
    '''
    Class for extracting 1919-2013 Irish debates.

    Only used for data extraction, use the `ParliamentIreland` class in the application.
    '''

    def sources(self, start, end):
        return []

    country = field_defaults.country()
    country.extractor = Constant('Ireland')

    fields = [country]

class ParliamentIrelandNew(XMLCorpus):
    '''
    Class for extracting 2014-2020 Irish debates.

    Only used for data extraction, use the `ParliamentIreland` class in the application.
    '''

    def sources(self, start, end):
        return []

    country = field_defaults.country()
    country.extractor = Constant('Ireland')

    fields = [country]

class ParliamentIreland(Parliament, Corpus):
    '''
    Class for 1919-2020 Irish debates.
    '''

    title = 'People & Parliament (Ireland)'
    description = 'Speeches from the Dáil Éireann and Seanad Éireann'
    min_date = datetime(year=1913, month=1, day=1)
    max_date = datetime(year=2020, month=12, day=31)
    data_directory = current_app.config['PP_IRELAND_DATA']
    es_index = current_app.config['PP_IRELAND_INDEX']
    image = 'ireland.png'
    description_page = 'ireland.md'
    language = None # corpus uses multiple languages, so we will not be using language-specific analyzers
    es_settings = {'index': {'number_of_replicas': 0}} # do not include analyzers in es_settings

    @property
    def subcorpora(self):
        return [
            ParliamentIrelandOld(),
            ParliamentIrelandNew(),
        ]

    def sources(self, start, end):
        for i, subcorpus in enumerate(self.subcorpora):
            for source in subcorpus.sources(start, end):
                filename, metadata = source
                metadata['subcorpus'] = i
                yield filename, metadata

    def source2dicts(self, source):
        filename, metadata = source

        subcorpus_index = metadata['subcorpus']
        subcorpus = self.subcorpora[subcorpus_index]

        return subcorpus.source2dicts(source)

    country = field_defaults.country()

    fields = [country]
