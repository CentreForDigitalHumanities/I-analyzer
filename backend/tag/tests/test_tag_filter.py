from tag.filter import tag_document_ids

def test_tag_document_ids(mock_corpus, auth_user_tag, tagged_documents):
    _, docs = tagged_documents
    assert len(tag_document_ids(auth_user_tag, mock_corpus)) == 3
