from django.conf import settings
from django.core.cache import cache
from es import download as es_download

match_all = {
    "query": {
        "match_all": {},
    }
}


def test_no_download_limit(mock_corpus, index_mock_corpus, mock_corpus_specs):
    results, total = es_download.scroll(mock_corpus, match_all)
    docs_in_corpus = mock_corpus_specs['total_docs']
    assert total == docs_in_corpus
    assert len(list(results)) == docs_in_corpus


def test_download_limit(mock_corpus, index_mock_corpus, mock_corpus_specs):
    limit = 2
    results, total = es_download.scroll(mock_corpus, match_all, download_size=limit)
    docs_in_corpus = mock_corpus_specs['total_docs']
    assert total == docs_in_corpus
    assert len(list(results)) == min(limit, docs_in_corpus)


def test_download_throttle(client, basic_mock_corpus, index_basic_mock_corpus, basic_corpus_public):
    """
    Test that the ResultsView returns a 429 error
    after exceeding the allowed number of download attempts.
    """
    cache.clear()
    # check if throttle rate settings are applied
    download_rate = settings.REST_FRAMEWORK.get(
        'DEFAULT_THROTTLE_RATES', {}).get('download')
    assert download_rate == '2/minute', \
        f"Expected download throttle rate to be '2/minute', but got '{download_rate}'."

    download_url = '/api/download/search_results'
    request_json = {
        "corpus": basic_mock_corpus,
        "es_query": {
            "size": 3,
            "query": {
                "match_all": {},
            }
        },
        "fields": ['date', 'content'],
        "size": 3,
        "route": f"/search/{basic_mock_corpus}",
        "encoding": "utf-8"
    }
    # Test that the view returns 429 after LIMIT+1 requests
    download_rate = int(download_rate.split('/')[0])

    responses = [client.post(download_url, request_json, content_type='application/json')
                 for _ in range(download_rate + 1)]
    assert [r.status_code for r in responses[0:download_rate]] == [200] * (len(responses) - 1), \
        f"Expected 200, got {responses[download_rate].status_code}"
    assert responses[download_rate].status_code == 429, \
        f"Expected 429, got {responses[download_rate].status_code}"
