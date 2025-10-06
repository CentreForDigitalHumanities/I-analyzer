from tag.filter import include_tag_filter

def api_query_to_es_query(api_query, corpus_name):
    es_query = api_query['es_query']

    if 'tags' in api_query:
        tag_data = api_query['tags']

        es_query = include_tag_filter(es_query, tag_data, corpus_name)

    return es_query
