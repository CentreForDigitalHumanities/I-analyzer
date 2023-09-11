import os
from addcorpus.save_corpus import load_and_save_all_corpora
from addcorpus.models import Corpus

here = os.path.abspath(os.path.dirname(__file__))

def test_dbnl_validation(settings):
    settings.DBNL_DATA = os.path.join(here, 'data')
    settings.CORPORA = {
        'dbnl': os.path.join(here, '..', 'dbnl.py'),
    }

    load_and_save_all_corpora()

    assert Corpus.objects.filter(name='dbnl').exists()
    assert Corpus.objects.get(name='dbnl').active == True
