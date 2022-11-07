from api.tests.mock_corpora.mock_corpus import MockCorpus
from api.tests.mock_corpora.large_mock_corpus import LargeMockCorpus
from api.tests.mock_corpora.multilingual_mock_corpus import MultilingualMockCorpus

CORPUS_SPECS = {
    'mock-corpus': {
        'min_date': MockCorpus.min_date,
        'max_date': MockCorpus.max_date,
        'total_docs': 3,
        'total_words': 67,
        'has_token_counts': True,
        'fields':  ['date', 'title', 'genre', 'content'],
    },
    'large-mock-corpus': {
        'min_date': LargeMockCorpus.min_date,
        'max_date': LargeMockCorpus.max_date,
        'total_docs': 11000,
        'total_words': 55000,
        'has_token_counts': False,
        'fields': ['date', 'content'],
    },
    'multilingual-mock-corpus': {
        'min_date': MultilingualMockCorpus.min_date,
        'max_date': MultilingualMockCorpus.max_date,
        'total_docs': 2,
        'total_words': 176,
        'has_token_counts': False,
        'fields': ['content', 'language']
    }
}
