import os
from corpora.utils_test import corpus_from_api

here = os.path.abspath(os.path.dirname(__file__))

def test_times(settings, db, admin_client):
    settings.CORPORA = {
        'times': 'corpora.times.times.Times',
    }
    settings.TIMES_DATA = ''

    corpus = corpus_from_api(admin_client)
    assert corpus['title'] == 'Times'
