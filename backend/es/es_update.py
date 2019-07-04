import elasticsearch.helpers as es_helpers

from flask import current_app

from ianalyzer.factories.elasticsearch import elasticsearch

import logging
logger = logging.getLogger('indexing')

def collect_documents(corpus, corpus_definition, queryModel = {}):
    client = elasticsearch(corpus)
    doc_type = corpus_definition.es_doctype
    server = current_app.config['CORPUS_SERVER_NAMES'][corpus]
    scroll_timeout = current_app.config['SERVERS'][server]['scroll_timeout']
    scroll_size = current_app.config['SERVERS'][server]['scroll_page_size']
    results = client.search(
        index=corpus,
        size = scroll_size,
        scroll = scroll_timeout,
        body = queryModel,
        timeout = '60s'
    )
    hits = len(results['hits']['hits'])
    total_hits = results['hits']['total']
    while len(hits)<total_hits:       
        scroll_id = results['_scroll_id']
        for doc in results:
            es_doc_id = doc['_id']
            update_document(corpus, doc_type, es_doc_id, queryModel)
        results = client.scroll(scroll_id=scroll_id,
            scroll_timeout=scroll_timeout)
        hits += len(results['hits']['hits'])


def update_document(client, index, doc_type, doc_id, body):
    client.update(index=index, doc_type=doc_type, id=doc_id, body=body)
    logger.info("Updated document with id '{}'".format(doc_id))
    global updated_docs
    updated_docs += 1