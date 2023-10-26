import pytest
import os

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def peace_corpus_settings(settings):
    settings.CORPORA = {
        'peaceportal-epidat': os.path.join(here, 'epidat.py'),
        'peaceportal-fiji': os.path.join(here, 'FIJI', 'fiji.py'),
        'peaceportal-iis': os.path.join(here, 'iis.py'),
        'peaceportal-tol': os.path.join(here, 'tol.py'),
    }

    settings.PEACEPORTAL_EPIDAT_DATA= os.path.join(here, 'tests', 'data', 'epidat')
    settings.PEACEPORTAL_FIJI_DATA= os.path.join(here, 'tests', 'data', 'fiji')
    settings.PEACEPORTAL_IIS_DATA = os.path.join(here, 'tests', 'data', 'iis', 'xml')
    settings.PEACEPORTAL_IIS_TXT_DATA = os.path.join(here, 'tests', 'data', 'iis', 'transcription_txts')
    settings.PEACEPORTAL_TOL_DATA = os.path.join(here, 'tests', 'data', 'tol')
    settings.PEACEPORTAL_ALIAS = 'peaceportal'