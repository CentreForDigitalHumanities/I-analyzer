from os import mkdir, rmdir
from os.path import abspath
from shutil import copy
from flask import current_app

import pytest

from addcorpus import load_corpus

#from ianalyzer.tests.conftest import admin_role, db, session, test_app


def test_key_error(session, monkeypatch):
    ''' Verify that exception is correctly raised
    - in case the config.CORPORA variable is empty
    '''
    with pytest.raises(KeyError) as e:
        monkeypatch.setitem(current_app.config, 'CORPORA', {})
        load_corpus.load_all_corpora()
        current_app.config['CORPUS_DEFINITIONS']['times']


def test_import_error(test_app, monkeypatch):
    ''' Verify that exceptions is correctly raised
    - in case the file path in config.CORPORA is faulty
    '''
    with pytest.raises(FileNotFoundError) as e:
        monkeypatch.setitem(
            test_app.config, 'CORPORA', {'times': '/somewhere/times/times.py'}
            )
        load_corpus.load_corpus('times')


def test_import_from_anywhere(session, db, test_app, admin_role, monkeypatch, tmpdir):
    ''' Verify that the corpus definition 
    can live anywhere in the file system
    '''
    testdir = tmpdir.mkdir('/testdir')
    copy(str(abspath('corpora/times/times.py')), str(testdir))
    path_testfile = str(testdir)+'/times.py'
    monkeypatch.setitem(current_app.config, 'CORPORA', {'times': path_testfile})
    load_corpus.load_all_corpora()
    assert 'times' in current_app.config['CORPUS_DEFINITIONS']
