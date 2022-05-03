from copy import copy, deepcopy
from typing import Dict
from datetime import date, datetime

def get_filters(query: Dict):
    """Get the list of filters in a query, or `None` if there are none."""
    try:
        return query['query']['bool']['filter']
    except KeyError:
        return None

def is_date_filter(filter):
    """Checks if a filter object is a date filter"""
    return 'range' in filter and 'date' in filter['range']

def parse_date(datestring):
    return datetime.strptime(datestring, '%Y-%m-%d')

def get_date_range(query: Dict):
    """Returns the filtered date range for a query, `None` if there is no query."""
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


def make_date_filter(min_date = None, max_date = None):
    params = {
        'format': 'yyyy-MM-dd',
    }
    if min_date:
        params['gte'] = date.strftime(min_date, '%Y-%m-%d')
    
    if max_date:
        params['lte'] = date.strftime(max_date, '%Y-%m-%d')
    
    return {
        'range': {
            'date': params
        }
    }
