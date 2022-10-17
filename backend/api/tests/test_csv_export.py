import pytest

import csv

from api.tasks import create_csv
from api.conftest import test_app

@pytest.fixture
def mock_es_result():
    return {
        "took": 42,
        "timed_out": "false",
        "hits": {
            "total": {
                "value": 3,
                "relation": "eq"
            },
            "max_score": 4.22,
            "hits": [
                {   "_index" : "parliament-netherlands",
                    "_type" : "_doc",
                    "_id": "nl.proc.ob.d.h-ek-19992000-552-587.1.19.1",
                    "_score" :  4.22,
                    "_source": {
                        "speech_id" : "nl.proc.ob.d.h-ek-19992000-552-587.1.19.1",
                        "speaker" : "Staatssecretaris Adelmund",
                        "speaker_id" : "nl.m.02500",
                        "role" : "Government",
                        "party" : "null",
                        "party_id" : "null",
                        "page" : "552-587",
                        "column" : "null",
                        "speech": "very long field"
                    },
                    "highlight" : {
                        "speech" : [
                            "Het gaat om een driehoek waarin <em>testen</em> en toetsen een"
                        ]
                    }
                }
            ]
        }
    }

@pytest.fixture
def mock_es_query():
    return "parliament-netherlands_query=test"

@pytest.fixture
def mock_csv_fields():
    return ['speech']

def test_create_csv(mock_es_result, mock_csv_fields, mock_es_query, test_app):
    filename = create_csv.search_results_csv(mock_es_result['hits']['hits'], mock_csv_fields, mock_es_query)
    counter = 0
    with open(filename) as f:
        csv_output = csv.DictReader(f, delimiter=';', quotechar='"')
        assert csv_output != None
        for row in csv_output:
            counter += 1
            assert 'speech' in row
        assert counter == 1
