import pytest

import csv

from api.tasks import create_csv

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

mock_queries = ['test', 'test2']

mock_timeline_result = [
    [
        {
            'key': '1800-01-01',
            'key_as_string': '1800-01-01',
            'match_count': 3,
            'total_doc_count': 2,
            'token_count': 10
        }, {
            'key': '1801-01-01',
            'key_as_string': '1801-01-01',
            'match_count': 5,
            'total_doc_count': 4,
            'token_count': 20
        }
    ], [
        {
            'key': '1800-01-01',
            'key_as_string': '1800-01-01',
            'match_count': 1,
            'total_doc_count': 2,
            'token_count': 10
        }, {
            'key': '1801-01-01',
            'key_as_string': '1801-01-01',
            'match_count': 3,
            'total_doc_count': 4,
            'token_count': 20
        }
    ]
]

mock_timeline_expected_data = [
    {
        'Query': 'test',
        'date': '1800-01-01',
        'Term frequency': '3',
        'Relative term frequency (by # documents)': '1.5',
        'Total documents': '2',
        'Relative term frequency (by # words)': '0.3',
        'Total word count': '10'
    }, {
        'Query': 'test',
        'date': '1801-01-01',
        'Term frequency': '5',
        'Relative term frequency (by # documents)': '1.25',
        'Total documents': '4',
        'Relative term frequency (by # words)': '0.25',
        'Total word count': '20'
    }, {
        'Query': 'test2',
        'date': '1800-01-01',
        'Term frequency': '1',
        'Relative term frequency (by # documents)': '0.5',
        'Total documents': '2',
        'Relative term frequency (by # words)': '0.1',
        'Total word count': '10'
    }, {
        'Query': 'test2',
        'date': '1801-01-01',
        'Term frequency': '3',
        'Relative term frequency (by # documents)': '0.75',
        'Total documents': '4',
        'Relative term frequency (by # words)': '0.15',
        'Total word count': '20'
    }
]

def test_timeline_csv(test_app):
    filename = create_csv.term_frequency_csv(mock_queries, mock_timeline_result, 'date')
    with open(filename) as f:
        reader = csv.DictReader(f)
        for expected_row in mock_timeline_expected_data:
            row = next(reader)
            assert row == expected_row
