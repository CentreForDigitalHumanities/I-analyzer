from flask import current_app
from datetime import datetime

from corpora.dutchnewspapers.dutchnewspapers_public import DutchNewspapersPublic

class DutchNewsPapersAll(DutchNewspapersPublic):
    title = "Dutch Newspapers (Delpher)"
    description = "Collection of all Dutch newspapers by the KB"
    data_directory = current_app.config['DUTCHNEWSPAPERS_ALL_DATA']
    es_index = current_app.config['DUTCHNEWSPAPERS_ALL_ES_INDEX']
    max_date = datetime(year=1995, month=12, day=31)

    def update_body(self, doc=None):
        if not doc:
            return True
        url = "http://resolver.kb.nl/resolve?urn=ddd:{}:mpeg21:{}".format(*doc['_id'].split(":"))
        return {
            "doc": {
                "url" : url
            }
        }
    
    def update_query(self, min_date, max_date):
        return {
            "query" : {
                "range" : { "date" : {
                    "gte": min_date,
                    "lte": max_date
                }}
            }
        }
