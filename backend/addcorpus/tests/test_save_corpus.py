from addcorpus.tests.mock_csv_corpus import MockCSVCorpus
from addcorpus.models import Corpus
from addcorpus.load_corpus import _save_field_in_database

def test_save_field_definition(db, mock_corpus):
    corpus = Corpus.objects.get(name=mock_corpus)
    corpus_def = MockCSVCorpus()

    for field_def in corpus_def.fields:
        field = _save_field_in_database(field_def, corpus)
        assert field
