from mock_corpora.mock_corpus_specs import CORPUS_SPECS
from es import download as es_download
from api import create_csv, tasks, download as api_download
from addcorpus.load_corpus import load_corpus
import csv
import pytest

match_all = {
    "query": {
        "match_all": {}
    }
}
def test_no_donwnload_limit(any_indexed_mock_corpus):
    results, total = es_download.scroll(any_indexed_mock_corpus, match_all)
    docs_in_corpus = CORPUS_SPECS[any_indexed_mock_corpus]['total_docs']
    assert total == docs_in_corpus
    assert len(results) == docs_in_corpus

def test_download_limit(any_indexed_mock_corpus):
    limit = 2
    results, total = es_download.scroll(any_indexed_mock_corpus, match_all, download_size=limit)
    docs_in_corpus = CORPUS_SPECS[any_indexed_mock_corpus]['total_docs']
    assert total == docs_in_corpus
    assert len(results) == min(limit, docs_in_corpus)

def test_download_log(mock_user):
    parameters = {
        'es_query': match_all,
        'size': 2
    }
    id = api_download.store_download_started('search_results', 'mock-corpus', parameters, mock_user.id)

    found_file = api_download.get_result_filename(id)
    assert found_file == None

    filename = 'result.csv'
    api_download.store_download_completed(id, filename)
    found_file = api_download.get_result_filename(id)
    assert found_file == filename

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
def mock_route():
    return "parliament-netherlands_query=test"

@pytest.fixture
def mock_csv_fields():
    return ['speech']

def test_create_csv(mock_es_result, mock_csv_fields, mock_route, test_app):
    filename = create_csv.search_results_csv(mock_es_result['hits']['hits'], mock_csv_fields, mock_route)
    counter = 0
    with open(filename) as f:
        csv_output = csv.DictReader(f, delimiter=';', quotechar='"')
        assert csv_output != None
        for row in csv_output:
            counter += 1
            assert 'speech' in row
        assert counter == 1

def test_format_route_to_filename():
    route = '/search/mock-corpus;query=test'
    request_json = { 'route': route }
    output = tasks.create_query(request_json)
    assert output == 'mock-corpus_query=test'

def all_results_csv(corpus):
    '''generate a results csv for a corpus based on a match_all query'''
    corpus_specs = CORPUS_SPECS[corpus]
    fields = corpus_specs['fields']

    request_json = {
        'corpus': corpus,
        'es_query': match_all,
        'fields': fields,
        'route': '/search/{};query=test'.format(corpus)
    }
    results = tasks.download_scroll(request_json)
    filename = tasks.make_csv(results, request_json)

    return filename, corpus_specs


def test_csv_fieldnames(indexed_mock_corpus):
    filename, corpus_specs = all_results_csv(indexed_mock_corpus)

    with open(filename) as csv_file:
        reader = csv.DictReader(csv_file, delimiter=';')
        assert set(reader.fieldnames) == set(corpus_specs['fields'] + ['query'])

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


def test_csv_contents(indexed_mock_corpus):
    '''Check the contents of the results csv for the basic mock corpus.'''

    filename, corpus_specs = all_results_csv(indexed_mock_corpus)

    expected = [{
        'date': '1818-01-01',
        'genre': "Science fiction",
        'title': "Frankenstein, or, the Modern Prometheus",
        'content': "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.",
    }, {
        'content': 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    }]

    assert_result_csv_expectations(filename, expected, delimiter=';')

def test_csv_contents_multilingual(indexed_multilingual_mock_corpus):
    '''Check the contents of the multilingual corpus, which also contains some special characters. This hangs on the entire pipeline of

    - extracting data from a CSV source file
    - indexing in elasticsearch
    - querying elasticsearc
    - exporting results to csv

    and thus checks that none of these steps mess up diacritics.
    '''

    filename, corpus_specs = all_results_csv(indexed_multilingual_mock_corpus)

    expected = [{
        'language': 'Swedish',
        'content': 'Svenska är ett östnordiskt språk som talas av ungefär tio miljoner personer främst i Sverige där språket har en dominant ställning som huvudspråk, men även som det ena nationalspråket i Finland och som enda officiella språk på Åland. I övriga Finland talas det som modersmål framförallt i de finlandssvenska kustområdena i Österbotten, Åboland och Nyland. En liten minoritet svenskspråkiga finns även i Estland. Svenska är nära besläktat och i hög grad ömsesidigt begripligt med danska och norska. De andra nordiska språken, isländska och färöiska, är mindre ömsesidigt begripliga med svenska. Liksom de övriga nordiska språken härstammar svenskan från en gren av fornnordiska, vilket var det språk som talades av de germanska folken i Skandinavien.'
    }, {
        'language': 'German',
        'content': 'Das Deutsche ist eine plurizentrische Sprache, enthält also mehrere Standardvarietäten in verschiedenen Regionen. Ihr Sprachgebiet umfasst Deutschland, Österreich, die Deutschschweiz, Liechtenstein, Luxemburg, Ostbelgien, Südtirol, das Elsass und Lothringen sowie Nordschleswig. Außerdem ist Deutsch eine Minderheitensprache in einigen europäischen und außereuropäischen Ländern, z. B. in Rumänien und Südafrika sowie Nationalsprache im afrikanischen Namibia. Deutsch ist die meistgesprochene Muttersprache in der Europäischen Union (EU).'
    }]

    assert_result_csv_expectations(filename, expected, delimiter=';')

def test_csv_encoding(indexed_multilingual_mock_corpus):
    '''Assert that the results csv file matches utf-8 encoding'''

    filename, corpus_specs = all_results_csv(indexed_multilingual_mock_corpus)

    with open(filename, 'rb') as f:
        binary_contents = f.read()

    expected_sentence = 'Svenska är ett östnordiskt språk som talas av ungefär tio miljoner personer främst i Sverige där språket har en dominant ställning som huvudspråk'
    bytes = str.encode(expected_sentence, 'utf-8')

    assert bytes in binary_contents


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

def test_timeline_csv(test_app):
    filename = create_csv.term_frequency_csv(mock_queries, mock_timeline_result, 'date', unit = 'year')

    assert_result_csv_expectations(filename, mock_timeline_expected_data, delimiter=',')


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
