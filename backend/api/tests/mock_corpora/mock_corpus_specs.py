from api.tests.mock_corpora.mock_corpus import MockCorpus
from api.tests.mock_corpora.large_mock_corpus import LargeMockCorpus
from api.tests.mock_corpora.multilingual_mock_corpus import MultilingualMockCorpus

CORPUS_SPECS = {
    'mock-corpus': {
        'min_date': MockCorpus.min_date,
        'max_date': MockCorpus.max_date,
        'total_docs': 3,
        'total_words': 67,
    },
    'large-mock-corpus': {
        'min_date': LargeMockCorpus.min_date,
        'max_date': LargeMockCorpus.max_date,
        'total_docs': 11000,
        'total_words': 55000,
    },
    'multilingual-mock-corpus': {
        'min_date': MultilingualMockCorpus.min_date,
        'max_date': MultilingualMockCorpus.max_date,
        'total_docs': 2,
        'total_words': 176,
    }
}
