from datetime import datetime
from glob import glob
import logging
from flask import current_app

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, CSV
from addcorpus.corpus import CSVCorpus
import corpora.parliament.utils.field_defaults as field_defaults
import corpora.parliament.utils.formatting as formatting

class ParliamentDenmarkNew(Parliament, CSVCorpus):
    title = 'People & Parliament (Denmark, 2009-2022)'
    description = "Speeches from the Folketing"
    min_date = datetime(year = 2009, month = 1, day = 1)
    data_directory = current_app.config['PP_DENMARK_NEW_DATA']
    es_index = current_app.config['PP_DENMARK_NEW_INDEX']
    image = 'denmark.jpg'
    es_settings = current_app.config['PP_ES_SETTINGS']
    es_settings['analysis']['filter'] = {
        "stopwords": {
          "type": "stop",
          "stopwords": "_danish_"
        },
        "stemmer": {
            "type": "stemmer",
            "language": "danish"
        }
    }

    language = 'danish'

    def sources(self, start, end):

        for filename in glob('{}/[0-9]*/*.txt'.format(self.data_directory), recursive=True):
            print(filename)
            yield filename, {}


    country = field_defaults.country()
    country.extractor = Constant('Denmark')

    def __init__(self):
        self.fields = [
            self.country,
        ]
