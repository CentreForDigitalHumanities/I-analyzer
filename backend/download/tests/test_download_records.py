from download.models import Download
from download import records

match_all = {
    "query": {
        "match_all": {}
    }
}

def test_download_records(corpus_user, mock_corpus):
    assert list(corpus_user.downloads.all()) == []

    parameters = {
        'es_query': match_all,
        'size': 2
    }
    id = records.store_download_started('search_results', mock_corpus, parameters, corpus_user.id)
    download = Download.objects.get(id=id)

    found_file = records.get_result_filename(id)
    assert found_file == None
    assert download.status == 'working'

    filename = 'result.csv'
    records.store_download_completed(id, filename)
    download.refresh_from_db()
    found_file = records.get_result_filename(id)
    assert found_file == filename
    assert download.is_done
    assert download.status == 'done'
    assert list(corpus_user.downloads.all()) == [download]

    # different download, mark as failed
    parameters = {
        'es_query': match_all,
        'size': 3
    }
    id = records.store_download_started('search_results', mock_corpus, parameters, corpus_user.id)

    records.store_download_failed(id)
    download_2 = Download.objects.get(id=id)
    assert download_2.status == 'error'
    assert list(corpus_user.downloads.all()) == [download, download_2]
