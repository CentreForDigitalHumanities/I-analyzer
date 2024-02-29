import csv

from download import SEARCH_RESULTS_DIALECT
from download.models import Download
from download.tasks import download_search_results


def test_large_download(large_mock_corpus,
                        index_large_mock_corpus,
                        admin_user,
                        large_mock_corpus_specs,
                        csv_directory):
    request_json = {
        "corpus": large_mock_corpus,
        "es_query": {"query": {"bool": {"must": {"match_all": {}}, "filter": []}}},
        "fields": ['date', 'content'],
        "route": f"/search/{large_mock_corpus}",
        "encoding": "utf-8"
    }

    chain = download_search_results(request_json, admin_user)
    results = chain.apply().get()

    download = Download.objects.last()
    assert download.status == 'done'

    with open(download.filename, 'r') as f:
        reader = csv.DictReader(f, dialect=SEARCH_RESULTS_DIALECT)
        assert len(list(reader)) == large_mock_corpus_specs.get('total_docs')
