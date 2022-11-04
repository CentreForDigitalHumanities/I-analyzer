from es import download
from mock_corpora.mock_corpus_specs import CORPUS_SPECS

match_all = {
    "query": {
        "match_all": {}
    }
}

def test_no_donwnload_limit(any_indexed_mock_corpus):
    results, total = download.scroll(any_indexed_mock_corpus, match_all)
    docs_in_corpus = CORPUS_SPECS[any_indexed_mock_corpus]['total_docs']
    assert total == docs_in_corpus
    assert len(results) == docs_in_corpus

def test_download_limit(any_indexed_mock_corpus):
    limit = 2
    results, total = download.scroll(any_indexed_mock_corpus, match_all, download_size=limit)
    docs_in_corpus = CORPUS_SPECS[any_indexed_mock_corpus]['total_docs']
    assert total == docs_in_corpus
    assert len(results) == min(limit, docs_in_corpus)
