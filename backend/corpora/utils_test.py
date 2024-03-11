from addcorpus.python_corpora.save_corpus import load_and_save_all_corpora

def corpus_from_api(client):
    '''
    Try loading corpora and fetching a corpus through the API.

    Used for testing that a corpus definition can be used
    without validation/syntax/runtime errors.

    Returns the serialised version of the first corpus. Most
    useful when you have configured your settings with only one corpus.
    '''

    load_and_save_all_corpora()

    response = client.get('/api/corpus/')
    assert response.status_code == 200
    assert len(response.data)
    corpus = response.data[0]
    return corpus
