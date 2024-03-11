from addcorpus.python_corpora.save_corpus import load_and_save_all_corpora
from addcorpus.models import Corpus

def test_save_parliament_corpora(parliament_corpora_settings, settings, db):
    load_and_save_all_corpora()

    for corpus_name in settings.CORPORA:
        corpus = Corpus.objects.get(name=corpus_name)
        assert corpus.ready_to_publish()
