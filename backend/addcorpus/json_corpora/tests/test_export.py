from addcorpus.json_corpora.export_json import export_json_corpus
from addcorpus.models import Corpus

def test_corpus_export(json_mock_corpus: Corpus, json_corpus_data):
    result = export_json_corpus(json_mock_corpus)
    assert result == json_corpus_data

