from flask import current_app

from corpora.dutchnewspapers.dutchnewspapers_public import DutchNewspapersPublic

class DutchNewsPapersAll(DutchNewspapersPublic):
    title = "Dutch Newspapers (Delpher)"
    description = "Collection of all Dutch newspapers by the KB"
    data_directory = current_app.config['DUTCHNEWSPAPERS_ALL_DATA']
    es_index = current_app.config['DUTCHNEWSPAPERS_ALL_ES_INDEX']
    max_date = datetime(year=2018, month=12, day=31)
