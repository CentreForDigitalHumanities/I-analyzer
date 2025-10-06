import os
from corpora.utils_test import corpus_from_api

here = os.path.abspath(os.path.dirname(__file__))

def test_news_us_19(settings, db, admin_client):
    settings.CORPORA = {
        'news_us_19': 'corpora.news_us_19.news_us_19.NewsUS'
    }
    settings.NEWS_US_19_DATA = ''

    corpus = corpus_from_api(admin_client)
    assert corpus['title'] == '19th Century US Newspapers'
