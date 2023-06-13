from tag.filter import tag_document_ids, tag_filter
from es import search


def test_tag_document_ids(mock_corpus, auth_user_tag, tagged_documents):
    _, docs = tagged_documents
    assert len(tag_document_ids(auth_user_tag, mock_corpus)) == 3


def test_tag_search(mock_corpus, index_mock_corpus, auth_user_tag, tagged_documents):
    filter = tag_filter(auth_user_tag.id, mock_corpus)
    query = {'query': filter}
    results = search.search(mock_corpus, query)
    assert search.total_hits(results) == len(tagged_documents)
