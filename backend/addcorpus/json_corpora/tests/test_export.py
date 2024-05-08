from addcorpus.json_corpora.export_json import export_json_corpus, export_json_field
from addcorpus.models import Corpus, Field
from addcorpus.json_corpora.import_json import _parse_field

def test_corpus_export(json_mock_corpus: Corpus, json_corpus_data):
    result = export_json_corpus(json_mock_corpus)
    assert result == json_corpus_data

def test_field_export(any_field_json):
    imported = _parse_field(any_field_json)
    field = Field(**imported)
    exported = export_json_field(field)
    assert any_field_json == exported
