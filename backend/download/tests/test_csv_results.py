import pytest
import csv
from es.search import hits
from download import create_csv

### SEARCH RESULTS

mock_es_result = {
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
                        "Het gaat om een driehoek waarin <em>testen</em> en toetsen een",
                        "om de highlights te <em>testen</em>"
                    ]
                }
            }
        ]
    }
}

@pytest.fixture()
def result_csv_with_highlights(csv_directory):
    route = 'parliament-netherlands_query=test'
    fields = ['speech']
    file = create_csv.search_results_csv(hits(mock_es_result), fields, route)
    return file

def test_create_csv(result_csv_with_highlights):
    counter = 0
    with open(result_csv_with_highlights) as f:
        csv_output = csv.DictReader(f, delimiter=';', quotechar='"')
        assert csv_output != None
        for row in csv_output:
            counter += 1
            assert 'speech' in row
        assert counter == 1

def test_csv_fieldnames(mock_corpus_results_csv, mock_corpus_specs):
    with open(mock_corpus_results_csv) as csv_file:
        reader = csv.DictReader(csv_file, delimiter=';')
        assert set(reader.fieldnames) == set(mock_corpus_specs['fields'] + ['query'])

def assert_result_csv_expectations(csv_path, expectations, delimiter=','):
    '''Check that a CSV contains the expected data. Parameters:

    - `csv_path`: path to csv file
    - `expectations`: list of dicts. Each item gives expectations for a row.
    '''
    with open(csv_path) as csv_file:
        reader = csv.DictReader(csv_file, delimiter=delimiter)
        rows = [row for row in reader]

        for i, expected_row in enumerate(expectations):
            for item in expected_row:
                assert rows[i][item] == expected_row[item]

def test_csv_contents(mock_corpus, small_mock_corpus, large_mock_corpus, ml_mock_corpus, mock_corpus_results_csv):
    '''Check the contents of the results csv for the basic mock corpus.

    Also includes the multilingual corpus, which includes some special characters, making sure
    that none of the steps in the download make encoding issues.'''

    if mock_corpus == small_mock_corpus:
        expected = [{
            'date': '1818-01-01',
            'genre': "Science fiction",
            'title': "Frankenstein, or, the Modern Prometheus",
            'content': "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.",
        }, {
            'content': 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
        }]
    elif mock_corpus == ml_mock_corpus:
        expected = [{
            'language': 'Swedish',
            'content': 'Svenska är ett östnordiskt språk som talas av ungefär tio miljoner personer främst i Sverige där språket har en dominant ställning som huvudspråk, men även som det ena nationalspråket i Finland och som enda officiella språk på Åland. I övriga Finland talas det som modersmål framförallt i de finlandssvenska kustområdena i Österbotten, Åboland och Nyland. En liten minoritet svenskspråkiga finns även i Estland. Svenska är nära besläktat och i hög grad ömsesidigt begripligt med danska och norska. De andra nordiska språken, isländska och färöiska, är mindre ömsesidigt begripliga med svenska. Liksom de övriga nordiska språken härstammar svenskan från en gren av fornnordiska, vilket var det språk som talades av de germanska folken i Skandinavien.'
        }, {
            'language': 'German',
            'content': 'Das Deutsche ist eine plurizentrische Sprache, enthält also mehrere Standardvarietäten in verschiedenen Regionen. Ihr Sprachgebiet umfasst Deutschland, Österreich, die Deutschschweiz, Liechtenstein, Luxemburg, Ostbelgien, Südtirol, das Elsass und Lothringen sowie Nordschleswig. Außerdem ist Deutsch eine Minderheitensprache in einigen europäischen und außereuropäischen Ländern, z. B. in Rumänien und Südafrika sowie Nationalsprache im afrikanischen Namibia. Deutsch ist die meistgesprochene Muttersprache in der Europäischen Union (EU).'
        }]
    else:
        expected = []

    assert_result_csv_expectations(mock_corpus_results_csv, expected, delimiter=';')

def test_csv_encoding(ml_mock_corpus_results_csv):
    '''Assert that the results csv file matches utf-8 encoding'''

    with open(ml_mock_corpus_results_csv, 'rb') as f:
        binary_contents = f.read()

    expected_sentence = 'Svenska är ett östnordiskt språk som talas av ungefär tio miljoner personer främst i Sverige där språket har en dominant ställning som huvudspråk'
    bytes = str.encode(expected_sentence, 'utf-8')

    assert bytes in binary_contents

### TERM FREQUENCY

mock_queries = ['test', 'test2']

mock_timeline_result = [
    {
        'query': 'test',
        'key': '1800-01-01',
        'key_as_string': '1800-01-01',
        'match_count': 3,
        'total_doc_count': 2,
        'token_count': 10
    }, {
        'query': 'test',
        'key': '1801-01-01',
        'key_as_string': '1801-01-01',
        'match_count': 5,
        'total_doc_count': 4,
        'token_count': 20
    }, {
        'query': 'test2',
        'key': '1800-01-01',
        'key_as_string': '1800-01-01',
        'match_count': 1,
        'total_doc_count': 2,
        'token_count': 10
    }, {
        'query': 'test2',
        'key': '1801-01-01',
        'key_as_string': '1801-01-01',
        'match_count': 3,
        'total_doc_count': 4,
        'token_count': 20
    }
]

mock_timeline_expected_data = [
    {
        'Query': 'test',
        'date': '1800',
        'Term frequency': '3',
        'Relative term frequency (by # documents)': '1.5',
        'Total documents': '2',
        'Relative term frequency (by # words)': '0.3',
        'Total word count': '10'
    }, {
        'Query': 'test',
        'date': '1801',
        'Term frequency': '5',
        'Relative term frequency (by # documents)': '1.25',
        'Total documents': '4',
        'Relative term frequency (by # words)': '0.25',
        'Total word count': '20'
    }, {
        'Query': 'test2',
        'date': '1800',
        'Term frequency': '1',
        'Relative term frequency (by # documents)': '0.5',
        'Total documents': '2',
        'Relative term frequency (by # words)': '0.1',
        'Total word count': '10'
    }, {
        'Query': 'test2',
        'date': '1801',
        'Term frequency': '3',
        'Relative term frequency (by # documents)': '0.75',
        'Total documents': '4',
        'Relative term frequency (by # words)': '0.15',
        'Total word count': '20'
    }
]

@pytest.fixture()
def term_frequency_file(index_small_mock_corpus, csv_directory):
    filename = create_csv.term_frequency_csv(mock_queries, mock_timeline_result, 'date', unit = 'year')
    return filename


def test_timeline_csv(term_frequency_file):
    assert_result_csv_expectations(term_frequency_file, mock_timeline_expected_data, delimiter=',')

def test_date_format():
    cases = [
        ('test', None, 'test'), # unchanged
        ('1800-01-01', 'year', '1800'),
        ('1800-01-01', 'month', 'January 1800'),
        ('1800-01-01', 'week', '1800-01-01'),
        ('1800-01-01', 'day', '1800-01-01'),
    ]

    for value, unit, expected in cases:
        assert create_csv.format_field_value(value, unit) == expected
