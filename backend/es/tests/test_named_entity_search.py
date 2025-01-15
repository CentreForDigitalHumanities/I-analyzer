from es.views import NamedEntitySearchView


def test_ner_search_view(es_ner_search_client, client):
    route = '/api/es/mock-csv-corpus/my_identifier/named_entities'
    response = client.get(route, content_type='application/json')
    assert response.status_code == 200


def test_construct_ner_query():
    viewset = NamedEntitySearchView()
    fields = ['content:ner']
    query = viewset.construct_named_entity_query(fields, 'my_identifier')
    expected = {
        "bool": {
            "must": {"term": {"id": "my_identifier"}},
            "should": [
                {"exists": {"field": "location:ner-kw"}},
                {"exists": {"field": "miscellaneous:ner-kw"}},
                {"exists": {"field": "organization:ner-kw"}},
                {"exists": {"field": "person:ner-kw"}},
            ],
        }
    }
    assert query == expected


def test_find_named_entity_fields(es_ner_search_client):
    viewset = NamedEntitySearchView()
    fields = viewset.find_named_entity_fields(
        es_ner_search_client, 'test-basic-corpus')
    assert len(fields) == 1
    assert fields[0] == 'content:ner'


def test_find_entities():
    viewset = NamedEntitySearchView()
    text = '[Guybrush Threepwood](PER) is looking for treasure on [Monkey Island](LOC)'
    output = viewset.find_entities(text)
    expected = [{'entity': 'person', 'text': 'Guybrush Threepwood'},
                {'entity': 'flat', 'text': ' is looking for treasure on '},
                {'entity': 'location', 'text': 'Monkey Island'}]
    assert output == expected
