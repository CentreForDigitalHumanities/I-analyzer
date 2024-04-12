from corpora_test.basic.mock_csv_corpus import MockCSVCorpus


class MockBasicCorpus(MockCSVCorpus):
    '''
    Same as the basic CSV corpus but with a different name.
    '''

    es_index = 'basic-corpus-index'
