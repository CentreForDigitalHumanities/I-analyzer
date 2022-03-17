import api.analyze as analyze

def test_extract_data_for_term_frequency(test_app):
    highlight_specs, aggregators = analyze.extract_data_for_term_frequency('mock-corpus')

    # highlighter should look at text and keyword fields
    highlight_target = {
		"number_of_fragments": 100,
		"fields": {
			"content": {
				"type": "unified",
				"fragment_size": 1
			},
            "content_deluxe": {
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

    # no .length multifield, so no aggregator
    assert aggregators == None

    # restrict the search field
    highlight_specs, aggregators = analyze.extract_data_for_term_frequency('mock-corpus', ['content_deluxe'])
    
    # highlighter should be restricted as well
    highlight_target = {
		"number_of_fragments": 100,
		"fields": {
            "content_deluxe": {
				"type": "unified",
				"fragment_size": 1
			},
        }
    }
    assert highlight_specs == highlight_target

    # token count aggregator should be included
    aggregators_target = {
        'token_count_content_deluxe': {
            'sum': {
                'field': 'content_deluxe.length'
            }
        }
    }
    assert aggregators == aggregators_target
