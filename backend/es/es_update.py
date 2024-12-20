from django.conf import settings
from ianalyzer.elasticsearch import elasticsearch

import logging
logger = logging.getLogger('indexing')

def update_index(corpus, corpus_definition, query_model):
    ''' update information for fields in the index
    requires the definition of the functions
    - update_query
    (restricts which documents are updated)
    - update_body
    (defines which fields should be updated with which value)
    in the corpus definition class
    '''
    client = elasticsearch(corpus)
    scroll_timeout, scroll_size = get_es_settings(corpus, corpus_definition)
    results = client.search(
        index=corpus,
        size=scroll_size,
        scroll=scroll_timeout,
        body=query_model,
        timeout=settings.ES_SEARCH_TIMEOUT
    )
    hits = len(results['hits']['hits'])
    total_hits = results['hits']['total']
    for doc in results['hits']['hits']:
        update_body = corpus_definition.update_body(doc)
        update_document(corpus, doc, update_body, client)
    while hits<total_hits:
        scroll_id = results['_scroll_id']
        for doc in results['hits']['hits']:
            update_body = corpus_definition.update_body(doc)
            update_document(corpus, doc, update_body, client)
        results = client.scroll(scroll_id=scroll_id,
            scroll=scroll_timeout)
        hits += len(results['hits']['hits'])
        logger.info("Updated {} of {} documents".format(hits, total_hits))


def update_by_query(corpus, corpus_definition, query_generator):
    client = elasticsearch(corpus)
    scroll_timeout, scroll_size = get_es_settings(corpus, corpus_definition)
    for query_model in query_generator:
        response = client.update_by_query(
            index=corpus,
            size=scroll_size,
            scroll=scroll_timeout,
            body=query_model,
            timeout=settings.ES_SEARCH_TIMEOUT
        )
        if response['updated']==0:
            logger.info('No documents updated for query {}'.format(query_model))


def update_document(corpus, doc, update_body, client=None):
    if not client:
        client = elasticsearch(corpus)
    doc_id = doc.get('_id', doc.get('id', None))
    if not doc_id:
        logger.info("failed to update the following document: {}".format(doc))
        return None
    client.update(index=corpus, id=doc_id, body=update_body)



def get_es_settings(corpus, corpus_definition):
    """ Get the settings for the scroll request.
    Return:
    - scroll_timeout
    - scroll_size
    """
    server = settings.CORPUS_SERVER_NAMES.get(corpus, 'default')
    scroll_timeout = settings.SERVERS[server]['scroll_timeout']
    scroll_size = settings.SERVERS[server]['scroll_page_size']
    return scroll_timeout, scroll_size
