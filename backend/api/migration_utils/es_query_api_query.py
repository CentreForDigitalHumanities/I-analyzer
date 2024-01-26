def es_query_to_api_query(es_query):
    return {'es_query': es_query}

def api_query_to_es_query(api_query):
    return api_query.get('es_query', {})
