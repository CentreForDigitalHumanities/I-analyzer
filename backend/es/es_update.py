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
    client = elasticsearch(corpus)
    doc_type = corpus_definition.es_doctype
    server = current_app.config['CORPUS_SERVER_NAMES'][corpus]
    scroll_timeout = current_app.config['SERVERS'][server]['scroll_timeout']
    scroll_size = current_app.config['SERVERS'][server]['scroll_page_size']
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
            update_document(client, corpus, corpus_definition, doc_type, doc)
        results = client.scroll(scroll_id=scroll_id,
            timeout=scroll_timeout)
        hits += len(results['hits']['hits'])
        logger.info("Updated {} of {} documents".format(hits, total_hits))


def update_document(client, index, corpus_definition, doc_type, doc):
    update_body = corpus_definition.update_body(doc)
    doc_id = doc['_id']
    client.update(index=index, doc_type=doc_type, id=doc_id, body=update_body)