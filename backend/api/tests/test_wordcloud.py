import api.analyze as analyze

"""
TODO: finish the wordcloud test after issue is resolved with testing (22/4/2022)
"""
def test_wordcloud(test_app, test_es_client):
    # simplified version of elasticsearch output
    documents = [
        { '_source': {
            'content': 'You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.'
        }, '_id' : 'id1'},
        { '_source': {
            'content': 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.'
        }, '_id' : 'id2'},
        { '_source': {
            'content': 'Alice in Wonderland","Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.'
        }, '_id' : 'id3'}
    ]

    target_unfiltered = [
        { 'key': 'of', 'doc_count': 5 },
        { 'key': 'a', 'doc_count': 4 },
        { 'key': 'to', 'doc_count': 3 },
        { 'key': 'you', 'doc_count': 2 },
        { 'key': 'the', 'doc_count': 2 },
        { 'key': 'that', 'doc_count': 2 },
        { 'key': 'in', 'doc_count': 2 },
        { 'key': 'with', 'doc_count': 1 },
        { 'key': 'will', 'doc_count': 1 },
        { 'key': 'wife', 'doc_count': 1 },
        { 'key': 'which', 'doc_count': 1 },
        { 'key': 'was', 'doc_count': 1 },
        { 'key': 'want', 'doc_count': 1 },
        { 'key': 'very', 'doc_count': 1 },
        { 'key': 'universally', 'doc_count': 1 },
        { 'key': 'truth', 'doc_count': 1 },
        { 'key': 'tired', 'doc_count': 1 },
        { 'key': 'such', 'doc_count': 1 },
        { 'key': 'sitting', 'doc_count': 1 },
        { 'key': 'sister', 'doc_count': 1 },
        { 'key': 'single', 'doc_count': 1 },
        { 'key': 'rejoice', 'doc_count': 1 },
        { 'key': 'regarded', 'doc_count': 1 },
        { 'key': 'possession', 'doc_count': 1 },
        { 'key': 'on', 'doc_count': 1 },
        { 'key': 'nothing', 'doc_count': 1 },
        { 'key': 'no', 'doc_count': 1 },
        { 'key': 'must', 'doc_count': 1 },
        { 'key': 'man', 'doc_count': 1 },
        { 'key': 'it', 'doc_count': 1 },
        { 'key': 'is', 'doc_count': 1 },
        { 'key': 'her', 'doc_count': 1 },
        { 'key': 'hear', 'doc_count': 1 },
        { 'key': 'having', 'doc_count': 1 },
        { 'key': 'have', 'doc_count': 1 },
        { 'key': 'has', 'doc_count': 1 },
        { 'key': 'good', 'doc_count': 1 },
        { 'key': 'get', 'doc_count': 1 },
        { 'key': 'fortune', 'doc_count': 1 },
        { 'key': 'forebodings', 'doc_count': 1 },
        { 'key': 'evil', 'doc_count': 1 },
        { 'key': 'enterprise', 'doc_count': 1 },
        { 'key': 'do', 'doc_count': 1 },
        { 'key': 'disaster', 'doc_count': 1 },
        { 'key': 'commencemen', 'doc_count': 1 }, 
        { 'key': 'by', 'doc_count': 1 },
        { 'key': 'beginning', 'doc_count': 1 },
        { 'key': 'be', 'doc_count': 1 },
        { 'key': 'bank', 'doc_count': 1 },
        { 'key': 'and', 'doc_count': 1 },
        { 'key': 'an', 'doc_count': 1 },
        { 'key': 'alice', 'doc_count': 1 },
        { 'key': 'acknowledge', 'doc_count': 1 }, 
        { 'key': 'accompanied', 'doc_count': 1 }
    ]
    # target_unfiltered = [
    #     { 'key':  'I', 'doc_count': 4 },
    #     { 'key': 'analyzer', 'doc_count': 3 },
    #     { 'key': 'is', 'doc_count': 1 },
    #     { 'key': 'great', 'doc_count': 1 },
    #     { 'key': 'love', 'doc_count': 2 },
    #     { 'key': 'to', 'doc_count': 1 },
    #     { 'key': 'analyze', 'doc_count': 2 }
    # ]

    output = analyze.make_wordcloud_data(documents, 'content', 'mock-corpus')

    for item in target_unfiltered:
        term = item['key'],
        doc_count = item['doc_count']
        assert output == term
        match = next(item for item in output if item['key'] == term)
        assert match
