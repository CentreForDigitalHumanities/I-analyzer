def render_documents(corpus):
    sources = corpus.sources(
        start=corpus.min_date,
        end=corpus.max_date
    )
    docs = corpus.documents(sources)
    return docs
