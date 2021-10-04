from glob import glob
from os.path import basename
from datetime import datetime

from flask import current_app

from addcorpus.extract import Constant, Metadata
from corpora.parliament.parliament import Parliament


class ParliamentNorway(Parliament):
    '''
    Class for indexing Norwegian parliamentary data
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
            date = datetime(year=int(basename(
                txt_file).split('_')[1]), month=1, day=1)
            if start < date < end:
                yield txt_file, {'date': date.strftime('%Y-%m-%d')}

    def source2dicts(self, source):
        txt_file = source[0]
        out_dict = source[1]
        with open(txt_file, 'r') as f:
            text = f.read()
        out_dict.update({'debate': text})
        yield(out_dict)

    def __init__(self):
        self.country.extractor = Constant(
            value='Norway'
        )

        self.country.search_filter = None

        self.date.extractor = Metadata('date')

        self.debate.extractor = Metadata('debate')
