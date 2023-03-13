from copy import deepcopy
from typing import Dict
from datetime import date, datetime

def get_query_text(query):
    """Get the text in the query"""
    try:
        text = query['query']['bool']['must']['simple_query_string']['query']
    except KeyError:
        text = None

    return text

def set_query_text(query, text):
    """Set the query text"""
    new_query = deepcopy(query)

    if get_query_text(query):
        new_query['query']['bool']['must']['simple_query_string']['query'] = text

    elif 'bool' in query['query'] and query['query']['bool']['must']:
        new_query['query']['bool']['must'] = format_query_text(text)

    else:
        new_query['query'] ={
            "bool": {
                "must": format_query_text(text),
                "filter": []
            }
        }

    return new_query

def format_query_text(query_text = None):
    '''Render the portion of the query that specifies the query text. Either simple_query_string,
    or match_all if the query text is None.'''

    if query_text:
        return {'simple_query_string':
            {
                'query': query_text,
                'lenient': True,
                'default_operator':'or'
            }
        }
    else:
        return {'match_all': {}}


def get_search_fields(query):
    """Get the search fields specified in the query."""
    try:
        fields = query['query']['bool']['must']['simple_query_string']['fields']
    except KeyError:
        fields = None

    return fields

def set_search_fields(query, fields):
    '''Set the search fields for a query'''

    if get_query_text(query) == None:
        return query
    else:
        query['query']['bool']['must']['simple_query_string']['fields'] = fields
        return query

def get_filters(query):
    """Get the list of filters in a query, or `None` if there are none."""
    try:
        filters = query['query']['bool']['filter']
    except KeyError:
        filters = None

    return filters

def is_date_filter(filter):
    """Checks if a filter object is a date filter"""
    return 'range' in filter and 'date' in filter['range']

def parse_date(datestring):
    return datetime.strptime(datestring, '%Y-%m-%d')

def get_date_range(query: Dict):
    """Returns the filtered date range for a query."""
    filters = get_filters(query)
    if filters:
        datefilters = list(filter(is_date_filter, filters))

        if len(datefilters):
            parameters = [f['range']['date'] for f in datefilters]
            min_dates = [parse_date(p['gte']) for p in parameters if 'gte' in p]
            max_dates = [parse_date(p['lte']) for p in parameters if 'lte' in p]

            min_date = max(min_dates) if len(min_dates) else None
            max_date = min(max_dates) if len(max_dates) else None

            return min_date, max_date

    return None, None

def add_filter(query, filter):
    """Add a filter to a query"""

    existing_filters = get_filters(query)

    if existing_filters:
        filters = existing_filters + [filter]
    else:
        filters = [filter]

    new_query = deepcopy(query)
    new_query['query']['bool']['filter'] = filters
    return new_query

def make_date_filter(min_date = None, max_date = None, date_field = 'date'):
    params = { 'format': 'yyyy-MM-dd' }
    if min_date:
        params['gte'] = date.strftime(min_date, '%Y-%m-%d')

    if max_date:
        params['lte'] = date.strftime(max_date, '%Y-%m-%d')

    return {
        'range': {
            date_field: params
        }
    }

def make_term_filter(field, value):
    return {
        'term': {
            field: value
        }
    }

def set_sort(query, sort_by, sort_direction):
    '''sets the 'sort' specification for a query.
    Parameters:
    - `query`: elasticsearch query
    - `sort_by`: string; the name of the field by which you want to sort
    - `direction`: either `'asc'` or `'desc'`
    '''
    specification = [{sort_by:sort_direction}]
    query['sort'] = specification
    return query

def remove_query(query):
    """
    Remove the query part of the query object
    (i.e. the search text)
    """

    new_query = deepcopy(query)
    new_query['query']['bool'].pop('must') #remove search term filter
    return new_query

MATCH_ALL = {
    "query": {
        "match_all": {}
    }
}
