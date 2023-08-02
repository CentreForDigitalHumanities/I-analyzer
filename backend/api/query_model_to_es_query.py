# converts json of the frontend 'QueryModel' to an elasticsearch query.

from visualization import query
from urllib.parse import unquote

def query_model_to_es_query(query_model):
    es_query = query.set_query_text(query.MATCH_ALL, get_query_text(query_model))

    filters = get_filters(query_model)
    for filter in filters:
        es_query = query.add_filter(es_query, filter)

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

def get_filters(query_model):
    return [
        convert_filter(filter)
        for filter in query_model.get('filters', [])
        if filter.get('useAsFilter', False)
    ]

def convert_filter(filter):
    field = filter['fieldName']
    type = filter['currentData']['filterType']

    type_converters = {
        'DateFilter': convert_date_filter,
        'RangeFilter': convert_range_filter,
        'MultipleChoiceFilter': convert_terms_filter,
        'BooleanFilter': convert_boolean_filter,
    }

    return type_converters[type](field, filter['currentData'])

def convert_date_filter(field, data):
    min = data['min']
    max = data['max']

    return {
        'range': {
            field: {
                'gte': min,
                'lte': max,
                'format':'yyyy-MM-dd',
            }
        }
    }

def convert_range_filter(field, data):
    min = data['min']
    max = data['max']

    return {
        'range': {
            field: {
                'gte': min,
                'lte': max,
            }
        }
    }

def convert_terms_filter(field, data):
    selected = data['selected']
    decoded = list(map(unquote, selected))

    return {
        'terms': {field: decoded}
    }

def convert_boolean_filter(field, data):
    checked = data['checked']

    return {
        'term': {field: checked}
    }
