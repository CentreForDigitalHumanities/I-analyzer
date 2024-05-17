import os
from django.conf import settings
import pytest

from addcorpus.models import Corpus
from addcorpus.reader import make_reader
from addcorpus.validation.indexing import CorpusNotIndexableError


def test_make_reader_python(basic_mock_corpus):
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    reader = make_reader(corpus)
    docs = list(reader.documents())
    # The number of lines differs because of different corpus configuration
    assert len(docs) == 10
    assert docs[0] == {
        'character': 'HAMLET',
        'line': "Whither wilt thou lead me? Speak, I\'ll go no further."
    }


def test_make_reader_json(json_mock_corpus):
    data_dir = os.path.join(settings.BASE_DIR, 'corpora_test', 'basic', 'source_data')
    json_mock_corpus.configuration.data_directory = data_dir
    json_mock_corpus.configuration.save()
    reader = make_reader(json_mock_corpus)
    docs = list(reader.documents())
    # The number of lines differs because of different corpus configuration
    assert len(docs) == 10
    assert docs[0] == {
        'character': 'HAMLET',
        'line': "Whither wilt thou lead me? Speak, I\'ll go no further."
    }


def test_reader_validates_directory(json_mock_corpus):
    with pytest.raises(CorpusNotIndexableError):
        reader = make_reader(json_mock_corpus)
