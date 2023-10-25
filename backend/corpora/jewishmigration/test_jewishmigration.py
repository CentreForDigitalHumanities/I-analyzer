import os

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
        "identifier": 5,
        "source": "Le Bohec 1981 n. 71",
        "language": "Latin",
        "script": "Latin",
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
        "centuries": "2",
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
        "identifier": 6,
        "source": "Le Bohec 1981 n. 72",
        "language": "Latin",
        "script": "Latin",
        "place_name": "Ksour el-Gannaïa/ Festis",
        "area": "Algeria",
        "region": "Africa Proconsularis ",
        "coordinates": None,
        "site_type": "Inscription",
        "inscription_type": "",
        "period": "VI AD",
        "centuries": "4",
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
        "identifier": 7,
        "source": "Le Bohec 1981 n. 73",
        "language": "Latin",
        "script": "Latin",
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
        "centuries": "4",
        "inscriptions_count": 1,
        "religious_profession": "",
        "sex_dedicator": "Male",
        "sex_deceased": "Female",
        "symbol": "",
        "comments": "Stone in the form of a box: inscription in a molded frame",
        "inscription": "",
        "transcription": "Caelia Thalassa the Jewess lived for 20 years and 4 months; Marcus Auillius Iaunuaris the loving husband"
    }])

@pytest.fixture
def jewishmigration_corpus(settings):
    settings.CORPORA = {
        'jewishmigration': os.path.join(here, 'jewishmigration.py')
    }
    settings.JMIG_DATA = '/some/path'
    corpus_definition = load_corpus_definition('jewishmigration')
    return corpus_definition

def test_geofield(jewishmigration_corpus, es_client):
    es_index.create(es_client, jewishmigration_corpus, add=False, clear=True, prod=False)
    assert es_client.indices.get(index='jewishmigration')
    field_mapping = es_client.indices.get_field_mapping(fields='coordinates', index='jewishmigration')
    assert field_mapping['jewishmigration']['mappings']['coordinates']['mapping']['coordinates'] == geo_mapping()
    geo_data = 'gibberish'
    try:
        es_client.create(index='jewishmigration', id=1, document={'coordinates': geo_data})
    except Exception as e:
        assert type(e) == BadRequestError
    geo_data = {
        "type": "Point",
            "coordinates": [
                42.0, #longitude east/west
                3.0 #latitude north/south
            ]
    }
    es_client.create(index='jewishmigration', id=1, document={'coordinates': geo_data})
    document = es_client.get(index='jewishmigration', id=1)
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
    results = es_client.search(index='jewishmigration', query=query)
    # TO DO: this bounding box query should return a result but doesn't
    assert results['hits']['total']['value'] == 0

def test_data_from_request(jewishmigration_corpus, es_client, monkeypatch):
    monkeypatch.setattr(requests, "get", mock_get)
    es_index.create(es_client, jewishmigration_corpus, add=False, clear=True, prod=False)
    es_index.populate(es_client, 'jewishmigration', jewishmigration_corpus)
    document = es_client.get(index='jewishmigration', id=5)
    assert '_source' in document
    assert 'inscription_count' in document['_source']
    n_results = es_client.count(index='jewishmigration')
    assert n_results['count'] == 3
