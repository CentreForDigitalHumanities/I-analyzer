from glob import glob
import logging

from flask import current_app

from corpora.parliament.parliament import Parliament
from addcorpus.extract import Constant, Combined, CSV
from addcorpus.corpus import CSVCorpus
from addcorpus.filters import MultipleChoiceFilter

class ParliamentGermanyOld(Parliament, CSVCorpus):
    title = 'People & Parliament (Germany Reichstag - 1867-1942)'
    description = "Speeches from the Reichstag"
    data_directory = current_app.config['PP_GERMANY_OLD_DATA']
    es_index = current_app.config['PP_GERMANY_OLD_INDEX']
    image = current_app.config['PP_GERMANY_OLD_IMAGE']
    es_settings = current_app.config['PP_ES_SETTINGS']
    es_settings['analysis']['filter'] = {
        "stopwords": {
          "type": "stop",
          "stopwords": "_german_"
        },
        "stemmer": {
            "type": "stemmer",
            "language": "german"
        }
    }

    field_entry = 'item_order'
    required_field = 'text'

    def __init__(self):
        self.country.extractor = Constant(
            value='Germany'
        )

        self.country.search_filter = None

        self.book_id.extractor = CSV(
            field='book_id'
        )

        self.book_label.extractor = CSV(
            field='book_label'
        )

        self.parliament.extractor = CSV(
            field='parliament'
        )

        self.date.extractor = CSV(
            field='date'
        )

        self.date_is_estimate.extractor = CSV(
            field='date_is_estimate'
        )

        self.session.extractor = CSV(
            field='sitzung'
        )

        self.page.extractor = CSV(
            field='page_number'
        )

        self.speech.extractor = CSV(
            field='text',
            multiple=True,
            transform=lambda x : ' '.join(x)
        )
        
        self.source_url.extractor = CSV(
            field='img_url'
        )

        self.speech_id.extractor = CSV(
            field='item_order'
        )

