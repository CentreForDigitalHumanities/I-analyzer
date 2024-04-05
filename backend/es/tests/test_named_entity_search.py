from es.views import NamedEntitySearchView


def test_ner_search_view(es_ner_search_client, client, times_user):
    client.force_login(times_user)
    route = '/api/es/times/named_entities'
    data = {'id': 'my_identifier'}
    response = client.post(route, data, content_type='application/json')
    assert response.status_code == 200


def test_construct_ner_query():
    viewset = NamedEntitySearchView()
    fields = ['content_ner']
    query = viewset.construct_named_entity_query(fields, 'my_identifier')
    expected = {
        "bool": {
            "must": [
                {
                    "term": {
                        "id": "my_identifier"
                    }
                },
                {
                    "terms": {
                        "content_ner": ["LOC", "PER", "ORG", "MISC"]
                    }
                }
            ]
        }
    }
    assert query == expected


def test_find_named_entity_fields(es_ner_search_client):
    viewset = NamedEntitySearchView()
    fields = viewset.find_named_entity_fields(
        es_ner_search_client, 'times-test')
    assert len(fields) == 1
    assert fields[0] == 'content_ner'


def test_find_entities():
    viewset = NamedEntitySearchView()
    text = '[Guybrush Threepwood](PER) is looking for treasure on [Monkey Island](LOC)'
    entity_classes = set()
    output = viewset.find_entities(text, entity_classes)
    expected = '<mark class="entity-per">Guybrush Threepwood</mark> is looking for treasure on <mark class="entity-loc">Monkey Island</mark>'
    assert output == expected
    assert len(list(entity_classes)) == 2
    assert all(entity in list(entity_classes) for entity in ['PER', 'LOC'])
