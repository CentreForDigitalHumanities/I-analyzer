# converts json of the frontend 'QueryModel' to an elasticsearch query.

from visualization import query

def query_model_to_es_query(query_model):
    es_query = query.set_query_text(query.MATCH_ALL, get_query_text(query_model))

    search_fields = get_search_fields(query_model)
    if search_fields:
        es_query = query.set_search_fields(es_query, search_fields)

    return es_query

def get_query_text(query_model):
    return query_model['queryText']

def get_search_fields(query_model):
    return query_model.get('fields', None)
