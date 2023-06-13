from tag.models import Tag
from visualization.query import add_filter

def include_tag_filter(es_query, tag_id, corpus_name):
    '''
    Include a filter for a tag in an elasticsearch query

    Returns the query with the tag filter added
    '''

    filter = tag_filter(tag_id, corpus_name)
    return add_filter(es_query, filter)

def tag_filter(tag_id, corpus_name):
    '''
    Generate an elasticsearch filter to match a tag.
    '''

    tag = Tag.objects.get(id=tag_id)

    documents = tag_document_ids(tag, corpus_name)

    return {
        'ids': { 'values': documents }
    }

def tag_document_ids(tag, corpus_name):
    '''
    Return all document IDs for a tag + corpus
    '''

    docs = tag.tagged_docs.filter(corpus__name=corpus_name)
    return [doc.doc_id for doc in docs]
