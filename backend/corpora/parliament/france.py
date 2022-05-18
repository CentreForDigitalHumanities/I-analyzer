from glob import glob
import logging
from datetime import datetime

from flask import current_app

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus
import corpora.parliament.utils.field_defaults as field_defaults
from corpora.parliament.utils.formatting import underscore_to_space

class ParliamentGermanyNew(Parliament, CSVCorpus):
    title = "People & Parliament (France 1881-2002)"
    description = "Speeches from the 3rd, 4th and 5th republic of France"
    min_date = datetime(year=1881, month=1, day=1)
    max_data = datetime(year=2002, month=12, day=31)
    data_directory = current_app.config['PP_FRANCE_DATA']
    es_index = current_app.config['PP_FRANCE_INDEX']
    image = current_app.config['PP_FRANCE_IMAGE']
    es_settings = current_app.config['PP_ES_SETTINGS']
    es_settings['analysis']['filter'] = {
        "stopwords": {
          "type": "stop",
          "stopwords": "_french_"
        },
        "stemmer": {
            "type": "stemmer",
            "language": "french"
        }
    }

    field_entry = 'speech_id'

    def sources(self, start, end):
        logger = logging.getLogger('indexing')
        for csv_file in glob('{}/*/*.csv'.format(self.data_directory)):
            yield csv_file, {}

    book_id = fields_defaults.book_id()
    book_id.extractor = Combined(
        CSV(field='book_id'),
        CSV(field='book_part_id'),
        transform=lambda x: ' '.join(x)
    )

    chamber = field_defaults.chamber()
    chamber.extractor = CSV(
        field='chamber',
        transform=underscore_to_space
    )

    constitution = field_defaults.constitution()
    constitution.extractor = CSV(
        field='era',
        transform=underscore_to_space
    )

    country = field_defaults.country()
    country.extractor = Constant(
        value='France'
    )

    date = field_defaults.date()
    date.extractor = CSV(
        field='date'
    )

    date_is_estimate = field_defaults.date_is_estimate()
    date_is_estimate.extractor = CSV(
        field='date_is_estimate'
    )



    legislature = field_defaults.legislature()
    legistlature.extractor = CSV(
        field='legislature'
    )

    page = field_defaults.page()
    page.extractor = CSV(
        field='page_order'
    )



    speech = field_defaults.speech()
    speech.extractor = CSV(
        field='page_text'
    )
    speech.es_mapping = {
        "type" : "text",
        "analyzer": "standard",
        "term_vector": "with_positions_offsets",
        "fields": {
        "stemmed": {
            "type": "text",
            "analyzer": "french"
            },
        "clean": {
            "type": 'text',
            "analyzer": "clean"
            },
        "length": {
            "type": "token_count",
            "analyzer": "standard",
            }
        }
    }

    speech_id = field_defaults.speech_id()
    speech_id.extractor = CSV(
        field='speech_id'
    )







