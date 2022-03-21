import api.analyze as analyze

def test_data(test_app, test_es_client):
    res = test_es_client.search(index="mock-corpus", body={"query": {"match_all": {}}})
    assert res['hits']['total']['value'] == 3

def test_extract_data_for_term_frequency(test_app):
    highlight_specs, aggregators = analyze.extract_data_for_term_frequency('mock-corpus')

    # highlighter should look at text and keyword fields
    highlight_target = {
		"number_of_fragments": 100,
		"fields": {
			"title": {
				"type": "unified",
				"fragment_size": 1
			},
            "content": {
				"type": "unified",
				"fragment_size": 1
			},
            "genre": {
                "type": "unified",
                "fragment_size": 1,
            }
        }
    }
    assert highlight_specs == highlight_target

    # no .length multifield for all fields, so no aggregator
    assert aggregators == None

    # restrict the search field to one with token counts

    highlight_specs, aggregators = analyze.extract_data_for_term_frequency('mock-corpus', ['content'])
    
    # highlighter should be restricted as well
    highlight_target = {
		"number_of_fragments": 100,
		"fields": {
            "content": {
				"type": "unified",
				"fragment_size": 1
			},
        }
    }
    assert highlight_specs == highlight_target

    # token count aggregator should be included
    aggregators_target = {
        'token_count_content': {
            'sum': {
                'field': 'content.length'
            }
        }
    }
    assert aggregators == aggregators_target
