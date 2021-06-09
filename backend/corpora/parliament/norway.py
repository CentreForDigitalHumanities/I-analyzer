from glob import glob
from os.path import basename

from flask import current_app

from addcorpus.extract import XML, Constant
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
            yield txt_file, {'year': '_'.split(basename(txt_file))[1]}

    def source2dicts(self, source):
        with open(source, 'r') as f:
            text = f.read()
        yield {'debate': text}

    def __init__(self):
        self.country.extractor = Constant(
            value='Norway'
        )

        self.country.search_filter = None

        self.date.extractor = XML(
            tag='date',
            attribute='format'
        )

        self.debate.extractor = XML(
            tag='debates',
            flatten=True
        )
