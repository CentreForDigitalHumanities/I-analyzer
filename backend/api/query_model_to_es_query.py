# converts json of the frontend 'QueryModel' to an elasticsearch query.

from visualization import query

def query_model_to_es_query(query_model):
    es_query = query.set_query_text(query.MATCH_ALL, query_model['queryText'])
    return es_query
