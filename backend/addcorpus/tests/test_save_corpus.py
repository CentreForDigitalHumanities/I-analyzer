import sys
from django.conf import settings
from datetime import datetime, date
from addcorpus.tests.mock_csv_corpus import MockCSVCorpus
from addcorpus.models import Corpus
from addcorpus.save_corpus import _save_field_in_database, load_and_save_all_corpora, _try_saving_corpus


def test_saved_corpora(db):
    '''
    Assert that all the mock corpora are saved to the database
    during test setup
    '''

    configured = settings.CORPORA

    for corpus_name in configured:
        assert Corpus.objects.filter(name=corpus_name).exists()

    assert len(Corpus.objects.all()) == len(configured)

def test_no_errors_when_saving_corpora(db, capsys):
    # try running the save function
    # sys.stdout/stderr needs to be passed explicitly for capture to work
    load_and_save_all_corpora(verbose=True, stdout=sys.stdout, stderr=sys.stderr)
    captured = capsys.readouterr()

    # assert no errors are logged
    assert not captured.err

    # assert stdout contains only success statements
    for line in captured.out.split('\n'):
        assert line == '' or line.startswith('Saved corpus:')

def test_saving_broken_corpus(db, mock_corpus):
    corpus = Corpus.objects.get(name=mock_corpus)
    corpus_def = MockCSVCorpus()

    corpus_def.min_date = 'Not a valid date'

    _try_saving_corpus(mock_corpus, corpus_def)

    corpus.refresh_from_db()
    # expect changes to be rolled back...
    assert date.__eq__(corpus.min_date, MockCSVCorpus.min_date) # specify which __eq__ func to avoid date vs. datetime comparison mishaps
    # ... but the corpus is now inactive
    assert corpus.active == False

def test_save_field_definition(db, mock_corpus):
    corpus = Corpus.objects.get(name=mock_corpus)
    corpus_def = MockCSVCorpus()

    corpus.fields.all().delete()

    for field_def in corpus_def.fields:
        field = _save_field_in_database(field_def, corpus)
        assert field
        assert field.name == field_def.name

