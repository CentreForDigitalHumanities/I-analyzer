from flask import current_app


class Parliament(Corpus):
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
    data_directory = current_app.config['PP_NORWAY_DATA']
    # store min_year as int, since datetime does not support BCE dates
    visualize = []
    es_index = current_app.config['PP_ALIAS']
    # scan_image_type = 'image/png'
    # fields below are required by code but not actually used
    min_date = datetime(year=1800, month=1, day=1)
    max_date = datetime(year=2021, month=12, day=31)
    image = 'bogus'
