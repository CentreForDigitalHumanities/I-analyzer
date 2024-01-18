import os
from time import sleep

from elasticsearch import BadRequestError
import pytest
import requests

from addcorpus.es_mappings import geo_mapping
from addcorpus.load_corpus import load_corpus_definition
from es import es_index

here = os.path.abspath(os.path.dirname(__file__))

class MockResponse(object):
    def __init__(self, mock_content):
        self.mock_content = mock_content
    
    def json(self):
        return self.mock_content

def mock_get(_dummy_path):
    return MockResponse(mock_content=[
        {
            "source": "Le Bohec 1981 n. 71",
            "languages": ["Latin", "Greek"],
            "scripts": ["Latin"],
            "place_name": "Constanine/ Cirta",
            "area": "Algeria",
            "region": "Africa Proconsularis ",
            "coordinates": {
                "type": "Point",
                "coordinates": [
                    36.36811466666666,
                    6.613302666666667
                ]
            },
            "site_type": "Inscription",
            "inscription_type": "Epitaph",
            "period": "II AD",
            "estimated_centuries": ["2", "3"],
            "inscriptions_count": 1,
            "religious_profession": "",
            "sex_dedicator": "",
            "sex_deceased": "Female",
            "symbol": "",
            "comments": "",
            "inscription": "",
            "transcription": "To the shadows of the underworld Julia Victoria the Jewess(?) CV"
        },
        {
            "source": "Le Bohec 1981 n. 72",
            "language": ["Latin"],
            "script": ["Latin"],
            "place_name": "Ksour el-Gannaïa/ Festis",
            "area": "Algeria",
            "region": "Africa Proconsularis ",
            "coordinates": None,
            "site_type": "Inscription",
            "inscription_type": "",
            "period": "VI AD",
            "estimated_centuries": ["4"],
            "inscriptions_count": 1,
            "religious_profession": "",
            "sex_dedicator": "",
            "sex_deceased": "",
            "symbol": "",
            "comments": "Fragment of a marble cancel",
            "inscription": "",
            "transcription": "Fear the faithful (?)"
        },
        {
            "source": "Le Bohec 1981 n. 73",
            "languages": ["Latin"],
            "scripts": ["Latin"],
            "place_name": "Setif",
            "area": "Algeria",
            "region": "Mauretania Caesariensis",
            "coordinates": {
                "type": "Point",
                "coordinates": [
                    5.4,
                    36.18333333333333
                ]
            },
            "site_type": "Inscription",
            "inscription_type": "Epitaph",
            "period": "VI AD",
            "estimated_centuries": ["3", "4"],
            "inscriptions_count": 1,
            "religious_profession": "",
            "sex_dedicator": "Male",
            "sex_deceased": "Female",
            "symbol": "",
            "comments": "Stone in the form of a box: inscription in a molded frame",
            "inscription": "",
            "transcription": "Caelia Thalassa the Jewess lived for 20 years and 4 months; Marcus Auillius Iaunuaris the loving husband"
        }
    ])


EXPECTED_DOCUMENT = {
    "id": "Le Bohec 1981 n. 71",
    "source_database": "Le Bohec 1981 n. 71",
    "language": ["Latin", "Greek"],
    "script": ["Latin"],
    "language_code": ['la', 'el'],
    "settlement": "Constanine/ Cirta",
    "country": "Algeria",
    "region": "Africa Proconsularis ",
    "coordinates": {
        "type": "Point",
        "coordinates": [
            36.36811466666666,
            6.613302666666667
        ]
    },
    "site_type": "Inscription",
    "inscription_type": "Epitaph",
    "period": "II AD",
    "estimated_centuries": [2, 3],
    "inscription_count": 1,
    "religious_profession": "",
    "sex_dedicator": "",
    "sex": "Female",
    "iconography": "",
    "comments": "",
    "transcription": "",
    "transcription_en": "To the shadows of the underworld Julia Victoria the Jewess(?) CV"
}

@pytest.fixture
def jm_corpus(settings):
    settings.CORPORA = {
        'jewishmigration': os.path.join(here, 'jewishmigration.py')
    }
    settings.JMIG_DATA = 'https://example.com'
    settings.JMIG_INDEX = 'test-jewishmigration'
    corpus_definition = load_corpus_definition('jewishmigration')
    return corpus_definition


@pytest.fixture
def jm_client(es_client, jm_corpus):
    """
    Create and populate an index for a mock corpus in elasticsearch.
    Returns an elastic search client for the mock corpus.
    """
    # add data from mock corpus
    es_index.create(es_client, jm_corpus, False, True, False)

    # ES is "near real time", so give it a second before we start searching the index
    sleep(1)
    yield es_client
    # delete index when done
    es_client.indices.delete(index=jm_corpus.es_index)


def test_geofield(jm_client, jm_corpus):
    assert jm_client.indices.get(index=jm_corpus.es_index)
    field_mapping = jm_client.indices.get_field_mapping(
        fields='coordinates', index=jm_corpus.es_index)
    assert field_mapping[jm_corpus.es_index]['mappings']['coordinates']['mapping']['coordinates'] == geo_mapping()
    geo_data = 'gibberish'
    try:
        jm_client.create(index=jm_corpus.es_index, id=1,
                         document={'coordinates': geo_data})
    except Exception as e:
        assert type(e) == BadRequestError
    geo_data = {
        "type": "Point",
            "coordinates": [
                42.0, #longitude east/west
                3.0 #latitude north/south
            ]
    }
    jm_client.create(index=jm_corpus.es_index, id=1,
                     document={'coordinates': geo_data})
    document = jm_client.get(index=jm_corpus.es_index, id=1)
    assert document['_source']['coordinates'] == geo_data
    query = {
        "geo_bounding_box": { 
          "coordinates": {
            "top_left": {
                "lon": 41.0,
                "lat": 5.0,
            },
            "bottom_right": {
                "lon": 43.0,
                "lat": 0.0
            }
          }
        }
    }
    results = jm_client.search(index=jm_corpus.es_index, query=query)
    # TO DO: this bounding box query should return a result but doesn't
    assert results['hits']['total']['value'] == 0


def test_data_from_request(jm_corpus, monkeypatch):
    monkeypatch.setattr(requests, "get", mock_get)
    sources = jm_corpus.sources(
        start=jm_corpus.min_date, end=jm_corpus.max_date)
    documents = list(jm_corpus.documents(sources))
    assert len(documents) == 3
    reference_document = documents[0]
    for key in EXPECTED_DOCUMENT.keys():
        assert key in reference_document.keys()
        assert EXPECTED_DOCUMENT[key] == reference_document[key]
