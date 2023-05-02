import pytest
import os

from addcorpus.load_corpus import load_corpus
from corpora.dbnl.utils import extract_metadata

here = os.path.abspath(os.path.dirname(__file__))

def test_metadata_extraction():
    csv_path = os.path.join(here, 'data', 'titels_pd.csv')
    data = extract_metadata(csv_path)
    assert len(data) == 7

    item = data['maer005sing01']
    assert item['titel'] == 'Het singende nachtegaeltje'
    assert len(item['auteurs']) == 1

    multiple_authors = data['maer002spie00']
    assert multiple_authors['titel'] == 'Spiegel historiael (5 delen)'
    assert len(multiple_authors['auteurs']) == 3


@pytest.fixture
def dbnl_corpus(settings):
    settings.DBNL_DATA = os.path.join(here, 'data')
    settings.CORPORA = {
        'dbnl': os.path.join(here, '..', 'dbnl.py')
    }
    return 'dbnl'


expected_docs = [
    {
        'title_id': 'maer005sing01',
        'title': 'Het singende nachtegaeltje',
        'volumes': None,
        'edition': '1ste druk',
        'author_id': ['maer005'],
        'author': 'Cornelis Maertsz.',
        'url': 'https://dbnl.org/tekst/maer005sing01_01',
        'url_txt': 'https://dbnl.org/nieuws/text.php?id=maer005sing01',
        'year': '1671',
        'year_full': '1671',
    }
]

def test_dbnl_extraction(dbnl_corpus):
    corpus = load_corpus(dbnl_corpus)
    docs = corpus.documents()

    for actual, expected in zip(docs, expected_docs):
        assert actual == expected
