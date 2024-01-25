import os
from corpora.utils_test import corpus_from_api

here = os.path.abspath(os.path.dirname(__file__))

def test_periodicals(settings, db, admin_client):
    settings.CORPORA = {
        'periodicals': os.path.join(here, 'periodicals.py')
    }
    settings.PERIODICALS_DATA = ''

    corpus = corpus_from_api(admin_client)
    assert corpus['title'] == 'Periodicals'
