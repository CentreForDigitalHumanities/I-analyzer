import api.analyze as analyze

"""
TODO: finish the wordcloud test after issue is resolved with testing (22/4/2022)
"""
def test_wordcloud():
    # simplified version of elasticsearch output
    documents = [
        { '_source': {
            'content': 'I-analyzer is great!'
        }, '_id' : 'id1'},
        { '_source': {
            'content': 'I love to analyze in I-analyzer.'
        }, '_id' : 'id2'},
        { '_source': {
            'content': 'I love I-analyzer.'
        }, '_id' : 'id3'},
        { '_source': {
            'content': 'I could analyze all day.'
        }, '_id' : 'id4' }
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

    output = analyze.make_wordcloud_data(documents, 'content', 'mock-corpus')

    for item in target_unfiltered:
        term = item['key'],
        doc_count = item['doc_count']
        assert output == term
        match = next(item for item in output if item['key'] == term)
        assert match
