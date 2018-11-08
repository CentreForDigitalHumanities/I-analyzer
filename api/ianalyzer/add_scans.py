# #!/usr/bin/env python3

# import logging
# import nl_core_news_sm
# import en_core_web_sm
# from elasticsearch import Elasticsearch
# from ianalyzer import config_fallback as config

# es = Elasticsearch()
# nlp = None
# updated_docs = 0


# def add_ner_details(corpus_definition, content_field, language, page_size):
#     init_nlp(language)

#     index = corpus_definition.es_index
#     doc_type = corpus_definition.es_doctype
#     size = page_size
#     scroll = config.SERVERS['default']['scroll_timeout']

#     # Collect initial page
#     page = init_search(index, doc_type, size, scroll, content_field)
#     total_hits = page['hits']['total']
#     scroll_size = len(page['hits']['hits'])

#     logging.info("Starting collection of NER details for {} documents in index '{}'".format(
#         total_hits, index))

#     while scroll_size > 0:
#         # Get the current scroll ID
#         sid = page['_scroll_id']

#         # Process current batch of hits
#         process_hits(page['hits']['hits'], index, doc_type, content_field)

#         # Scroll to next page
#         page = es.scroll(scroll_id=sid, scroll=scroll)

#         # Get the number of results in current page to control loop
#         scroll_size = len(page['hits']['hits'])

#     global updated_docs
#     logging.info("Updated {} documents".format(updated_docs))


# def update_document(index, doc_type, doc_id, ner_details):
#     body = {"doc": {"ner": ner_details}}
#     es.update(index=index, doc_type=doc_type, id=doc_id, body=body)
#     logging.info("Updated document with id '{}'".format(doc_id))
#     global updated_docs
#     updated_docs += 1


# def process_hits(hits, index, doc_type, content_field):
#     for doc in hits:
#         es_doc_id = doc["_id"]
#         content = doc["_source"][content_field]
#         ner_details = get_ner_details(content)
#         update_document(index, doc_type, es_doc_id, ner_details)


# def get_ner_details(data):
#     doc = nlp(data)
#     ner_details = []

#     for ent in doc.ents:
#         ner_details.append(
#             {
#                 "text": ent.text,
#                 "start": ent.start_char,
#                 "end": ent.end_char,
#                 "label": ent.label_
#             }
#         )

#     return ner_details


# def init_search(index, doc_type, size, scroll, content_field):
#     return es.search(
#         index=index,
#         doc_type=doc_type,
#         body={"_source": content_field},
#         params={"scroll": scroll, "size": size}
#     )


# def init_nlp(language):
#     global nlp

#     if language == 'nl':
#         nlp = nl_core_news_sm.load()
#     else:
#         nlp = en_core_web_sm.load()
