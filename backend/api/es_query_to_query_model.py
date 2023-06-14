from visualization import query
from urllib.parse import quote

def es_query_to_query_model(es_query):
    model = dict()

    transformations = [
        include_query_text,
        include_search_fields,
        include_filters,
        include_sort,
        include_highlight
    ]

    for transform in transformations:
        transform(model, es_query)

    return model

def include_query_text(model, es_query):
    query_text = query.get_query_text(es_query)
    model['queryText'] = query_text
    return model

def include_search_fields(model, es_query):
    search_fields = query.get_search_fields(es_query)
    if search_fields:
        model['fields'] = search_fields
    return model

def include_sort(model, es_query):
    if 'sort' in es_query:
        sort = es_query['sort'][0]
        field = list(sort.keys())[0]
        direction = sort[field]
        ascending = direction == 'asc'
        model['sortBy'] = field
        model['sortAscending'] = ascending

    return model

def include_highlight(model, es_query):
    if 'highlight' in es_query:
        higlight = es_query['highlight']
        size = higlight['fragment_size']
        model['highlight'] = size
    return model

def include_filters(model, es_query):
    filters = query.get_filters(es_query)
    model['filters'] = list(map(format_filter_for_query_model, filters))
    return model

def format_filter_for_query_model(es_filter):
    type = list(es_filter.keys())[0]
    condition = es_filter[type]
    field = list(condition.keys())[0]

    data_formatters = {
        'range': format_range_data,
        'terms': format_terms_data,
        'term': format_term_data,
    }

    current_data = data_formatters[type](condition[field])

    return {
        'fieldName': field,
        'description': '',
        'useAsFilter': True,
        'currentData': current_data,
    }

def format_range_data(data):
    min = data['gte']
    max = data['lte']

    if data.get('format', None):
        return {
            'filterType': 'DateFilter',
            'min': min,
            'max': max,
        }

    return {
        'filterType': 'RangeFilter',
        'min': min,
        'max': max,
    }

def format_term_data(data):
    return {
        'filterType': 'BooleanFilter',
        'checked': data
    }

def format_terms_data(data):
    selected = list(map(quote, data))
    return {
        'filterType': 'MultipleChoiceFilter',
        'selected': selected
    }
