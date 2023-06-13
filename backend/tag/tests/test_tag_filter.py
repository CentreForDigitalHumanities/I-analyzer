from tag.filter import tag_document_ids, tag_filter, include_tag_filter
from es import search
from visualization.query import set_query_text, MATCH_ALL


def test_tag_document_ids(mock_corpus, auth_user_tag, tagged_documents):
    _, docs = tagged_documents
    assert len(tag_document_ids(auth_user_tag, mock_corpus)) == 3


def test_tag_filter(mock_corpus, index_mock_corpus, auth_user_tag, tagged_documents):
    filter = tag_filter(auth_user_tag.id, mock_corpus)
    query = {'query': filter}
    results = search.search(mock_corpus, query)
    assert search.total_hits(results) == 3

def test_search_with_tag(mock_corpus, index_mock_corpus, auth_user_tag, tagged_documents):
    query = set_query_text(MATCH_ALL, 'text')

    results = search.search(mock_corpus, query)
    assert search.total_hits(results) == 2

    query_with_tag = include_tag_filter(query, auth_user_tag.id, mock_corpus)

    results_with_tag = search.search(mock_corpus, query_with_tag)
    assert search.total_hits(results_with_tag) == 1
