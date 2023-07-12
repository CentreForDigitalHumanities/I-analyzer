from tag.models import Tag, TaggedDocument
from visualization.query import add_filter

def include_tag_filter(es_query, tag_ids, corpus_name):
    '''
    Include a filter for a tag in an elasticsearch query

    Returns the query with the tag filter added
    '''

    filter = tag_filter(tag_ids, corpus_name)
    return add_filter(es_query, filter)

def tag_filter(tag_ids, corpus_name):
    '''
    Generate an elasticsearch filter to match a tag.
    '''

    tags = Tag.objects.filter(id__in=tag_ids)

    documents = tag_document_ids(tags, corpus_name)

    return {
        'ids': { 'values': documents }
    }

def tag_document_ids(tags, corpus_name):
    '''
    Return all document IDs for a corpus + a set of tags
    '''

    docs = TaggedDocument.objects.filter(
        corpus__name=corpus_name,
        tags__in = tags
    )

    return [doc.doc_id for doc in docs]
