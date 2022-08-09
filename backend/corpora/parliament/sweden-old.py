from glob import glob
from datetime import datetime

from addcorpus.corpus import CSVCorpus
from addcorpus.extract import CSV, Constant
from corpora.parliament.parliament import Parliament
import corpora.parliament.utils.field_defaults as field_defaults
import corpora.parliament.utils.constants as constants
import corpora.parliament.utils.formatting as formatting

from flask import current_app

def format_era(era):
    eras = {
        'standsriksdagen': 'Ståndsriksdagen',
        'tvakammarriksdagen': 'Tvåkammarriksdagen'
    }

    return eras.get(era, 'MISSING: ' + era)

def format_chamber(chamber):
    chambers = {
        'forsta': 'Första kammaren',
        'andra': 'Andra kammaren',
        'adel': 'Adel',
        'präster': 'Präster',
        'borgerskap': 'Borgerskap',
        'bönder': 'Bönder'
    }

    return chambers.get(chamber, chamber)

class ParliamentSwedenOld(Parliament, CSVCorpus):
    title = 'People and Parliament (Sweden 1809-1919)'
    description = 'Speeches from the Riksdag'
    min_date = datetime(year=1809, month=1, day=1)
    max_date = datetime(year=1919, month=12, day=31)
    data_directory = current_app.config['PP_SWEDEN_OLD_DATA']
    es_index = current_app.config['PP_SWEDEN_OLD_INDEX']

    # TODO: remove es_settings after #771)
    es_settings = current_app.config['PP_ES_SETTINGS']
    es_settings['analysis']['filter'] = {
        "stopwords": {
          "type": "stop",
          "stopwords": "_swedish_"
        },
        "stemmer": {
            "type": "stemmer",
            "language": "swedish"
        }
    }

    document_context = constants.document_context()
    document_context['context_fields'] = ['chamber', 'date_earliest', 'date_latest']

    def sources(self, start, end):
        for csv_file in glob('{}/**/*.csv'.format(self.data_directory), recursive=True):
            yield csv_file, {}


    language = 'swedish'
    image = current_app.config['PP_SWEDEN_OLD_IMAGE']

    book_id = field_defaults.book_id()
    book_id.extractor = CSV(field = 'book_id')

    book_label = field_defaults.book_label()
    book_label.extractor = CSV(field = 'book_label')

    country = field_defaults.country()
    country.extractor = Constant('Sweden')

    era = field_defaults.era()
    era.extractor = CSV(
        field = 'era',
        transform = format_era
    )

    chamber = field_defaults.chamber()
    chamber.extractor = CSV(
        field = 'chamber',
        transform = format_chamber
    )
    chamber.search_filter.option_count = 6
    chamber.description = 'Chamber (in Tvåkammarriksdagen era) or estate (in Ståndsriksdagen era) where the debate took place'

    date_earliest = field_defaults.date_earliest()
    date_earliest.extractor = CSV(field='date_from')
    date_earliest.search_filter.lower = min_date
    date_earliest.search_filter.upper = max_date

    date_latest = field_defaults.date_latest()
    date_latest.extractor = CSV(field='date_to')
    date_latest.search_filter.lower = min_date
    date_latest.search_filter.upper = max_date

    speech = field_defaults.speech()
    speech.extractor = CSV(field='text')
    speech.visualizations = ['wordcloud'] # exclude ngram since there is no field named 'date'

    page = field_defaults.page()
    page.extractor = CSV(field='page_number')

    sequence = field_defaults.sequence()
    sequence.extractor = CSV(
        field = 'date_order',
        transform = formatting.extract_integer_value,
    )
    sequence.description = 'Order of documents within the same date range and chamber'

    url_pdf = field_defaults.url()
    url_pdf.extractor = CSV(
        field='pdf_url'
    )
    url_pdf.display_name = 'Source url (PDF)'
    url_pdf.description = 'URL to PDF source file of this speech'

    url_xml = field_defaults.url()
    url_xml.extractor = CSV(
        field='xml_url'
    )
    url_xml.name = 'url_xml'
    url_xml.display_name = 'Source url (XML)'
    url_xml.description = 'URL to XML source file of this speech'

    def __init__(self):
        self.fields = [
            self.book_id, self.book_label,
            self.country,
            self.era,
            self.chamber,
            self.date_earliest, self.date_latest,
            self.speech,
            self.page,
            self.sequence,
            self.url_pdf, self.url_xml,
        ]
