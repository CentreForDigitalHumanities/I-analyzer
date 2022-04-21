import api.analyze as analyze

def test_wordcloud():
    # simplified version of elasticsearch output
    documents = [
        { '_source': {
            'content': 'I-analyzer is great!',
        } },
        { '_source': {
            'content': 'I love to analyze in I-analyzer.',
        } },
        { '_source': {
            'content': 'I love I-analyzer.'
        } },
        { '_source': {
            'content': 'I could analyze all day.'
        } }
    ]

    target_unfiltered = [
        { 'key':  'I', 'doc_count': 4 },
        { 'key': 'analyzer', 'doc_count': 3 },
        { 'key': 'is', 'doc_count': 1 },
        { 'key': 'great', 'doc_count': 1 },
        { 'key': 'love', 'doc_count': 2 },
        { 'key': 'to', 'doc_count': 1 },
        { 'key': 'analyze', 'doc_count': 2 }
    ]

    output = analyze.make_wordcloud_data(documents, 'content')

    for item in target_unfiltered:
        term = item['key'],
        doc_count = item['doc_count']

        long_enough = len(term) >= 3
        not_too_frequent = doc_count < 0.7 * len(documents)

        if long_enough and not_too_frequent:
            assert output == term
            match = next(item for item in output if item['key'] == term)
            assert match
