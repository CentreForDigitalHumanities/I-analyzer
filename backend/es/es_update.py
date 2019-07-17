import elasticsearch.helpers as es_helpers

from flask import current_app

from ianalyzer.factories.elasticsearch import elasticsearch

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
    client = get_client(corpus)
    doc_type, scroll_timeout, scroll_size = get_es_settings(corpus, corpus_definition)
    results = client.search(
        index=corpus,
        size = scroll_size,
        scroll = scroll_timeout,
        body = query_model,
        timeout = '60s'
    )
    hits = len(results['hits']['hits'])
    total_hits = results['hits']['total']
    for doc in results['hits']['hits']:
        update_document(client, corpus, corpus_definition, doc_type, doc)
    while hits<total_hits:       
        scroll_id = results['_scroll_id']
        for doc in results['hits']['hits']:
            update_body = corpus_definition.update_body(doc)
            update_document(corpus, doc_type, doc, update_body, client)
        results = client.scroll(scroll_id=scroll_id,
            scroll=scroll_timeout)
        hits += len(results['hits']['hits'])
        logger.info("Updated {} of {} documents".format(hits, total_hits))


def update_document(corpus, doc_type, doc, update_body, client=None):
    if not client:
        client = get_client(corpus)
    doc_id = doc['_id'] or doc['id']
    client.update(index=corpus, doc_type=doc_type, id=doc_id, body=update_body)


def get_client(corpus):
    return elasticsearch(corpus)
    

def get_es_settings(corpus, corpus_definition):
    doc_type = corpus_definition.es_doctype
    server = current_app.config['CORPUS_SERVER_NAMES'][corpus]
    scroll_timeout = current_app.config['SERVERS'][server]['scroll_timeout']
    scroll_size = current_app.config['SERVERS'][server]['scroll_page_size']
    return doc_type, scroll_timeout, scroll_size