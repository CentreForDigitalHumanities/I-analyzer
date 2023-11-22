from datetime import datetime, timedelta

IGNORE_KEYS = ['size', 'scroll', 'from', 'aggs']
'Keys that should be ignored when comparing if two queries are identical'

def should_save_query(user, es_query):
    '''
    Whether a query should be saved in the search history for a user
    '''

    if not user.profile.enable_search_history:
        return False

    if has_aggregations(es_query):
        return False

    if any(same_query(es_query, q.query_json) for q in recent_queries(user)):
        return False

    return True

def recent_queries(user):
    one_hour_ago = datetime.today() - timedelta(hours = 1)
    return user.queries.filter(
        completed__gte=one_hour_ago
    )

def has_aggregations(es_query):
    return 'aggs' in es_query


def _filter_relevant_keys(es_query):
    return {
        key: value
        for (key, value) in es_query.items()
        if key not in IGNORE_KEYS
    }

def same_query(es_query_1, es_query_2):
    return _filter_relevant_keys(es_query_1) == _filter_relevant_keys(es_query_2)
