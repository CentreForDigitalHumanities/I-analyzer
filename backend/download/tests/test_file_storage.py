import os
from download import tasks
from download.conftest import all_results_request_json
from download.models import Download

def test_download_filename(auth_user, small_mock_corpus, index_small_mock_corpus, small_mock_corpus_specs):
    request = all_results_request_json(small_mock_corpus, small_mock_corpus_specs)
    tasks.download_search_results(request, auth_user).apply()
    download = Download.objects.latest('completed')
    _, filename = os.path.split(download.filename)
    name, ext = os.path.splitext(filename)
    assert name == str(download.id)
    assert ext == '.csv'
