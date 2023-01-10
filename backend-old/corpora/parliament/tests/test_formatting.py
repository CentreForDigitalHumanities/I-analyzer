import corpora.parliament.utils.formatting as formatting

def test_pages():
    cases = [
        {
            'input': [1],
            'expected': '1'
        }, {
            'input': [1,2,3],
            'expected': '1-3',
        }, {
            'input': [1,1,1],
            'expected': '1'
        }
    ]

    for case in cases:
        output = formatting.format_page_numbers(case['input'])
        assert output == case['expected']

def test_underscore_to_space():
    cases = [
        {
            'input': 'no underscore',
            'expected_title': 'No Underscore',
            'expected_notitle': 'no underscore'
        }, {
            'input': 'one_underscore',
            'expected_title': 'One Underscore',
            'expected_notitle': 'one underscore',
        },  {
            'input': 'two__underscores',
            'expected_title': 'Two Underscores',
            'expected_notitle': 'two underscores',
        }
    ]

    for case in cases:
        output_title = formatting.underscore_to_space(case['input'])
        assert output_title == case['expected_title']
        output_notitle = formatting.underscore_to_space(case['input'], title_case=False)
        assert output_notitle == case['expected_notitle']
