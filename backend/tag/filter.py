from tag.models import Tag, TaggedDocument
from visualization.query import add_filter
from addcorpus.permissions import corpus_name_from_request

def handle_tags_in_request(request, parameter_key = None):
    '''
    If tags are specified in the request data,
    add them to the elasticsearch query as a filter
    '''
    data = request.data[parameter_key] if parameter_key else request.data

    if 'tags' in data:
        corpus_name = corpus_name_from_request(request)
        data['es_query'] = include_tag_filter(
            data['es_query'],
            data['tags'],
            corpus_name
        )

def include_tag_filter(es_query, tag_ids, corpus_name):
    '''
    Include a filter for a tag in an elasticsearch query

    Returns the query with the tag filter added
    '''

    if not tag_ids:
        return es_query

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
