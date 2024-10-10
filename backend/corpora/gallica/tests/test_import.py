from datetime import datetime
import requests

from conftest import mock_response
from addcorpus.models import Corpus
from addcorpus.python_corpora.load_corpus import load_corpus_definition
from addcorpus.python_corpora.save_corpus import load_and_save_all_corpora


def test_gallica_import(monkeypatch, gallica_corpus_settings):
    monkeypatch.setattr(requests, "get", mock_response)
    corpus_def = load_corpus_definition("figaro")
    sources = corpus_def.sources(
        start=datetime(year=1930, month=1, day=1),
        end=datetime(year=1930, month=12, day=31),
    )
    documents = list(corpus_def.documents(sources))
    assert len(documents) == 1
