from addcorpus.models import Corpus, CorpusDocumentationPage

def test_corpus_model(db):
    corpus = Corpus(name = 'test_corpus')
    corpus.save()

    assert Corpus.objects.filter(name = corpus.name)

    corpus.delete()

    assert not Corpus.objects.filter(name = corpus)

def test_corpus_documentation_page_model(db, basic_mock_corpus):
    corpus = Corpus.objects.get(name=basic_mock_corpus)
    page = CorpusDocumentationPage(
        corpus_configuration=corpus.configuration,
        type=CorpusDocumentationPage.PageType.LICENSE,
        content='Do whatever you want.',
    )
    assert page.page_index == 2
