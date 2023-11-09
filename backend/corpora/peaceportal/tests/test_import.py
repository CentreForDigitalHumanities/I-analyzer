import os
import warnings
import pytest
from datetime import datetime

from addcorpus.load_corpus import load_corpus_definition

CORPUS_TEST_DATA = [
    {
        'name': 'peaceportal-epidat',
        'docs': [],
        'n_documents': 2
    },
    {
        'name': 'peaceportal-fiji',
        'docs': [],
        'n_documents': 3
    },
    {
        'name': 'peaceportal-iis',
        'docs': [],
        'n_documents': 3
    },
    {
        'name': 'peaceportal-tol',
        'docs': [],
        'n_documents': 3
    }
]

def corpus_test_name(corpus_spec):
    return corpus_spec['name']

@pytest.mark.parametrize("corpus_object", CORPUS_TEST_DATA, ids=corpus_test_name)
def test_imports(peace_corpus_settings, corpus_object):
    corpus = load_corpus_definition(corpus_object.get('name'))
    assert len(os.listdir(os.path.abspath(corpus.data_directory))) != 0

    start = corpus_object['start'] if 'start' in corpus_object else corpus.min_date
    end = corpus_object['end'] if 'end' in corpus_object else corpus.max_date

    tested_fields = set()
    resulted_fields = set()

    docs = get_documents(corpus, start, end)
    for target in corpus_object.get('docs'):
        doc = next(docs)
        for key in target:
            tested_fields.add(key)
            assert key in doc
            assert doc[key] == target[key]

        for key in doc:
            resulted_fields.add(key)

    for key in resulted_fields:
        if not key in tested_fields:
            message = 'Key "{}" is included in the result for {} but has no specification'.format(key, corpus_object.get('name'))
            warnings.warn(message)

    docs = get_documents(corpus, start, end)
    assert len(list(docs)) == corpus_object.get('n_documents')

def get_documents(corpus, start, end):
    sources = corpus.sources(
        start=start,
        end=end
    )
    return corpus.documents(sources)
