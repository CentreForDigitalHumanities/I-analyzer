import os
from django.conf import settings
from addcorpus.models import Corpus
from addcorpus.reader import make_reader



def test_make_reader_python(mock_corpus):
    corpus = Corpus.objects.get(name=mock_corpus)
    reader = make_reader(corpus)
    docs = list(reader.documents())
    # The number of lines differs because of different corpus configuration
    assert len(docs) == 7
    assert docs[0] == {
        'character': 'HAMLET',
        'lines': ["Whither wilt thou lead me? Speak, I\'ll go no further."]
    }


def test_make_reader_json(json_mock_corpus):
    data_dir = os.path.join(settings.BASE_DIR, 'corpora_test', 'csv', 'source_data')
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
