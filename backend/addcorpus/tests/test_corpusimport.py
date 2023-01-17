import os
import pytest
from addcorpus import load_corpus

def test_key_error(db, settings):
    ''' Verify that exception is correctly raised
    - in case the config.CORPORA variable is empty
    '''

    settings.CORPORA = {}
    settings.CORPUS_DEFINITIONS = {}

    with pytest.raises(KeyError) as e:
        load_corpus.load_all_corpora()
        settings.CORPUS_DEFINITIONS['times']

def test_import_error(db, settings):
    ''' Verify that exceptions is correctly raised
    - in case the file path in config.CORPORA is faulty
    '''

    settings.CORPORA = {'times': '/somewhere/times/times.py'}
    settings.CORPUS_DEFINITIONS = {}

    with pytest.raises(FileNotFoundError) as e:
        load_corpus.load_corpus('times')


mock_corpus_definition = '''
class Times():
    title = "Times"
    description = "Newspaper archive, 1785-2010"
    fields = []
'''

def test_import_from_anywhere(db, settings, tmpdir, admin_group):
    ''' Verify that the corpus definition
    can live anywhere in the file system
    '''
    testdir = tmpdir.mkdir('/testdir')

    with open(os.path.join(testdir, 'times.py'), 'w') as f:
        f.write(mock_corpus_definition)
    path_testfile = str(testdir)+'/times.py'

    settings.CORPORA = {'times': path_testfile}
    settings.CORPUS_DEFINITIONS = {}

    load_corpus.load_all_corpora()
    assert 'times' in settings.CORPUS_DEFINITIONS
