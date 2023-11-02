from datetime import datetime, timedelta

def save_query(user, es_query):
    '''
    Whether to save a query in the search history for a user
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

def same_query(es_query_1, es_query_2):
    return es_query_1 == es_query_2
