from addcorpus.models import Corpus
from download.models import Download

match_all = {
    "query": {
        "match_all": {}
    }
}

def test_download_records(admin_user, mock_corpus, mock_corpora_in_db):
    assert list(admin_user.downloads.all()) == []

    parameters = {
        'es_query': match_all,
        'size': 2
    }
    download = Download.objects.create(
        download_type='search_results',
        corpus=Corpus.objects.get(name=mock_corpus),
        parameters=parameters,
        user=admin_user
    )

    assert download.filename == None
    assert download.status == 'working'

    filename = 'result.csv'
    download.complete(filename)
    assert download.filename == filename
    assert download.is_done
    assert download.status == 'done'
    assert list(admin_user.downloads.all()) == [download]

    # different download, mark as failed
    parameters = {
        'es_query': match_all,
        'size': 3
    }
    download_2 = Download.objects.create(
        download_type='search_results',
        corpus=Corpus.objects.get(name=mock_corpus),
        parameters=parameters,
        user=admin_user
    )

    download_2.complete()
    assert download_2.status == 'error'
    assert list(admin_user.downloads.all()) == [download, download_2]
