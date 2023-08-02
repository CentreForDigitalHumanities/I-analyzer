import os
from corpora.utils_test import corpus_from_api

here = os.path.abspath(os.path.dirname(__file__))

def test_goodreads(settings, admin_client):
    settings.CORPORA = {
        'goodreads': os.path.join(here, 'goodreads.py')
    }
    settings.GOODREADS_DATA = ''

    corpus = corpus_from_api(admin_client)
    assert corpus['title'] == 'DIOPTRA-L'
