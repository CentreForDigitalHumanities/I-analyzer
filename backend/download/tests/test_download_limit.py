from es import download as es_download

match_all = {
    "query": {
        "match_all": {}
    }
}
def test_no_donwnload_limit(mock_corpus, index_mock_corpus, mock_corpus_specs):
    results, total = es_download.scroll(mock_corpus, match_all)
    docs_in_corpus = mock_corpus_specs['total_docs']
    assert total == docs_in_corpus
    assert len(results) == docs_in_corpus

def test_download_limit(mock_corpus, index_mock_corpus, mock_corpus_specs):
    limit = 2
    results, total = es_download.scroll(mock_corpus, match_all, download_size=limit)
    docs_in_corpus = mock_corpus_specs['total_docs']
    assert total == docs_in_corpus
    assert len(results) == min(limit, docs_in_corpus)
