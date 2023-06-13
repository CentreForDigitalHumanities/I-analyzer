from tag.models import Tag

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
