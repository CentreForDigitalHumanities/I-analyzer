from large_mock_corpus import TOTAL_DOCUMENTS as TOTAL_DOCUMENTS_LARGE
from test_term_frequency import TOTAL_DOCS_IN_MOCK_CORPUS as TOTAL_DOCUMENTS_SMALL
from es import download
from addcorpus.load_corpus import load_corpus


match_all = {
    "query": {
        "match_all": {}
    }
}

def test_no_donwnload_limit(indexed_large_mock_corpus):
    results, total = download.scroll(indexed_large_mock_corpus, match_all)
    assert total == TOTAL_DOCUMENTS_LARGE
    assert len(results) == TOTAL_DOCUMENTS_LARGE

def test_download_limit(indexed_mock_corpus):
    limit = 2
    results, total = download.scroll(indexed_mock_corpus, match_all, download_size=limit)
    assert total == TOTAL_DOCUMENTS_SMALL
    assert len(results) == limit
