from addcorpus.models import Corpus
from addcorpus.reader import make_reader


def test_make_reader_python(mock_corpus):
    py_corpus = Corpus.objects.get(name=mock_corpus)
    reader = make_reader(py_corpus)
    docs = list(reader.documents())
    assert len(docs) == 7
    assert docs[0] == {
        'character': 'HAMLET',
        'lines': ["Whither wilt thou lead me? Speak, I\'ll go no further."]
    }
