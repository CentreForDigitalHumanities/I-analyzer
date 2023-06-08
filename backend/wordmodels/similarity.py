import numpy as np

from wordmodels.utils import transform_query

def term_similarity(wm, term1, term2):
    vectors = wm['vectors']
    transformed1 = transform_query(term1)
    transformed2 = transform_query(term2)
    vocab = vectors.index_to_key
    if transformed1 in vocab and transformed2 in vocab:
        similarity = vectors.similarity(transformed1, transformed2)
        return float(similarity)

def find_n_most_similar(wm, query_term, n):
    """given vectors of svd_ppmi or word2vec values
    with its vocabulary and analyzer,
    determine which n terms match the given query term best
    """
    transformed_query = transform_query(query_term)
    vectors = wm['vectors']
    results = most_similar_items(vectors, transformed_query, n)
    return [{
        'key': result[0],
        'similarity': result[1]
    } for result in results]

def most_similar_items(vectors, term, n):
    '''
    Find the n most similar terms in a keyed vectors matrix, while filtering on the vocabulary.

    parameters:
    - `vectors`: the KeyedVectors
    - `term`: the term for which to find the nearest neighbours, transformed with `transform_query`
    - `n`: number of neighbours to return
    '''
    vocab = vectors.index_to_key
    if term in vocab:
        results = vectors.most_similar(term, topn=n)
        return results
    return []
