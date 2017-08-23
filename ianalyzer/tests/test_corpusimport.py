import pytest

from ianalyzer import config

def test_key_error(capsys):
	''' Verify that exception is correctly raised
	- in case the config.CORPORA variable is empty
	'''
	with pytest.raises(KeyError) as e:
		config.CORPORA = {}
		from ianalyzer import corpora
	out, err = capsys.readouterr()
	assert 'No file path for' in str(err)
	

def test_import_error(capsys):
	''' Verify that exceptions is correctly raised
	- in case the file path in config.CORPORA is faulty
	'''
	with pytest.raises(FileNotFoundError) as e:
		config.CORPUS = 'times'
		config.CORPORA = {'times': '/ianalyzer/corpora/tmes.py'}
		from ianalyzer import corpora
	out, err = capsys.readouterr()
	assert 'No module describing' in str(err)