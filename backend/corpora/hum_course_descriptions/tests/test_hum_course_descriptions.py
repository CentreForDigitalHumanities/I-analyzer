import os
import pytest

from corpora.utils_test import corpus_from_api
from addcorpus.save_corpus import load_and_save_all_corpora
from addcorpus.load_corpus import load_corpus_definition

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def hum_course_descriptions_settings(settings, db):
    settings.CORPORA = {
        'hum_course_descriptions': os.path.join(here, '../hum_course_descriptions.py')
    }
    settings.HUM_COURSE_DESCRIPTIONS_DATA = os.path.join(here, 'data')

def test_hum_course_descriptions_model(hum_course_descriptions_settings, db, admin_client):
    corpus = corpus_from_api(admin_client)
    assert corpus['title'] == 'Humanities Course Descriptions'

def test_hum_course_descriptions_extraction(hum_course_descriptions_settings):
    load_and_save_all_corpora()
    corpus = load_corpus_definition('hum_course_descriptions')
    assert corpus

    docs = list(corpus.documents())
    assert len(docs) == 1
