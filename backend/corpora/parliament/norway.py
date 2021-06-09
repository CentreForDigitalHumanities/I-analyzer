from glob import glob
from os.path import basename
from datetime import datetime

from flask import current_app

from addcorpus.extract import Constant, Metadata
from corpora.parliament.parliament import Parliament


class ParliamentNorway(Parliament):
    '''
    Base class for corpora in the People & Parliament project.

    This supplies the frontend with the information it needs.
    Child corpora should only provide extractors for each field.
    Create indices (with alias 'peopleparliament') from
    the corpora specific definitions, and point the application
    to this base corpus.
    '''

    title = "People & Parliament (Norway)"
    description = "Minutes from European parliaments"
    data_directory = current_app.config['PP_NO_DATA']
    # store min_year as int, since datetime does not support BCE dates
    visualize = []
    es_index = current_app.config['PP_NO_INDEX']
    es_alias = current_app.config['PP_ALIAS']

    def sources(self, start, end):
        for txt_file in glob('{}/*.txt'.format(self.data_directory)):
            yield txt_file, {'date': datetime(year='_'.split(basename(txt_file))[1], month=1, day=1)}

    def source2dicts(self, source):
        txt_file = source[0]
        out_dict = source[1]
        with open(txt_file, 'r') as f:
            text = f.read()
        yield out_dict.update({'debate': text})

    def __init__(self):
        self.country.extractor = Constant(
            value='Norway'
        )

        self.country.search_filter = None

        self.date.extractor = Metadata('date')

        self.debate.extractor = Metadata('debate')
