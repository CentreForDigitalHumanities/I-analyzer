# converts json of the frontend 'QueryModel' to an elasticsearch query.

from visualization import query

def query_model_to_es_query(query_model):
    es_query = query.set_query_text(query.MATCH_ALL, get_query_text(query_model))

    search_fields = get_search_fields(query_model)
    if search_fields:
        es_query = query.set_search_fields(es_query, search_fields)

    sort_by, sort_direction = get_sort(query_model)
    if sort_by:
        es_query = query.set_sort(es_query, sort_by, sort_direction)

    highlight = get_highlight(query_model)
    if highlight:
        es_query = query.set_highlight(es_query, highlight)

    return es_query

def get_query_text(query_model):
    return query_model.get('queryText', None)

def get_search_fields(query_model):
    return query_model.get('fields', None)

def get_sort(query_model):
    sort_by = query_model.get('sortBy', None)
    direction = 'asc' if query_model.get('sortAscending', True) else 'desc'
    return sort_by, direction

def get_highlight(query_model):
    return query_model.get('highlight', None)

