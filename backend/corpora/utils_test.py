def corpus_from_api(client):
    '''
    Try fetching a corpus through the API.

    Used for testing that a corpus definition can be used
    without syntax/runtime errors.

    Returns the serialised version of the first corpus. Most
    useful when you have configured your settings with only one corpus.
    '''

    response = client.get('/api/corpus/')
    assert response.status_code == 200
    assert len(response.data)
    corpus = response.data[0]
    return corpus
