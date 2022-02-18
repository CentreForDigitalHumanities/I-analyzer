from glob import glob
import logging

from flask import current_app

from parliament import Parliament
from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus

class ParliamentCanada(Parliament, CSVCorpus):
    title = 'People & Parliament (Canada)'
    description = "Speeches from Canadian Parliament"
    data_directory = current_app.config['PP_UK_DATA']
    es_index = current_app.config['PP_UK_INDEX']
    image = current_app.config['PP_UK_IMAGE']
    #####  ES things to do together next week  #####
    # es_settings = current_app.config['PP_ES_SETTINGS']
    # es_settings['analysis']['filter'] = {
    #     "stopwords": {
    #       "type": "stop",
    #       "stopwords": "_english_"
    #     },
    #     "stemmer": {
    #         "type": "stemmer",
    #         "language": "english"
    #     }
    # }
