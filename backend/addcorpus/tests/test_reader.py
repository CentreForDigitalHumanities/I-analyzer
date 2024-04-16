import os
from addcorpus.models import Corpus
from addcorpus.reader import make_reader

HERE = os.path.abspath(os.path.dirname(__file__))


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
    data_dir = os.path.join(HERE, 'csv_example')
    reader = make_reader(json_mock_corpus, data_dir)
    docs = list(reader.documents())
    # The number of lines differs because of different corpus configuration
    assert len(docs) == 10
    assert docs[0] == {
        'character': 'HAMLET',
        'line': "Whither wilt thou lead me? Speak, I\'ll go no further."
    }
