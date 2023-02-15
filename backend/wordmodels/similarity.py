import numpy as np

from wordmodels.utils import transform_query, index_to_term


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
    vocab = vectors.index_to_key
    results = most_similar_items(vectors, transformed_query, n)
    return [{
        'key': result[0],
        'similarity': result[1]
    } for result in results]

def most_similar_items(vectors, term, n, missing_terms = 0):
    '''
    Find the n most similar terms in a keyed vectors matrix, while filtering on the vocabulary.

    parameters:
    - `vectors`: the KeyedVectors
    - `term`: the term for which to find the nearest neighbours. Should already have been
    passed through the model's analyzer.
    - `n`: number of neighbours to return
    - `missing_terms`: used for recursion. indicates that of the `n` nearest vectors, `missing_terms` vectors
    are not actually included in `vocab`, hence we should request `n + missing_terms` vectors
    '''
    vocab = vectors.index_to_key
    if term in vocab:
        results = vectors.most_similar(term, topn=n + missing_terms)
        results_complete = len(results) == min(n, len(vocab) - 1)
        if results_complete:
            return results
        else:
            delta = n - len(results)
            return most_similar_items(vectors, term, n, missing_terms=delta + missing_terms)
    return []
