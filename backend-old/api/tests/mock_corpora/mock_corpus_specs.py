from api.tests.mock_corpora.multilingual_mock_corpus import MultilingualMockCorpus

CORPUS_SPECS = {
    'multilingual-mock-corpus': {
        'min_date': MultilingualMockCorpus.min_date,
        'max_date': MultilingualMockCorpus.max_date,
        'total_docs': 2,
        'total_words': 176,
        'has_token_counts': False,
        'fields': ['content', 'language']
    }
}
