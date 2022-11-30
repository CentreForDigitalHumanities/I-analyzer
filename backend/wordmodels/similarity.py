import numpy as np

from wordmodels.utils import transform_query, index_to_term


def term_similarity(wm, term1, term2):
    matrix = wm['matrix']
    analyzer = wm['analyzer']
    transformed1 = transform_query(term1, analyzer)
    transformed2 = transform_query(term2, analyzer)
    vocab = wm['vocab']
    if transformed1 in vocab and transformed2 in vocab:
        similarity = matrix.similarity(transformed1, transformed2)
        return float(similarity)

def find_n_most_similar(wm, query_term, n):
    """given a matrix of svd_ppmi or word2vec values
    with its vocabulary and analyzer,
    determine which n terms match the given query term best
    """
    analyzer = wm['analyzer']
    vocab = wm['vocab']
    transformed_query = transform_query(query_term, analyzer)
    matrix = wm['matrix']
    results = most_similar_items(matrix, vocab, transformed_query, n)
    return [{
        'key': result[0],
        'similarity': result[1]
    } for result in results]

def most_similar_items(matrix, vocab, term, n, missing_terms = 0):
    '''
    Find the n most similar terms in a keyed vectors matrix, while filtering on the vocabulary.

    parameters:
    - `matrix`: the KeyedVectors matrix
    - `vocab`: the vocabulary for the model. This may be a subst of the keys in `matrix`, so
    results will be filtered on vocab.
    - `term`: the term for which to find the nearest neighbours. Should already have been
    passed through the model's analyzer.
    - `n`: number of neighbours to return
    - `missing_terms`: used for recursion. indicates that of the `n` nearest vectors, `missing_terms` vectors
    are not actually included in `vocab`, hence we should request `n + missing_terms` vectors
    '''

    if term in vocab:
        results = matrix.most_similar(term, topn=n + missing_terms)
        filtered_results = [(key, score) for key, score in results if key in vocab]
        results_complete = len(filtered_results) == min(n, len(vocab) - 1)
        if results_complete:
            return filtered_results
        else:
            delta = n - len(filtered_results)
            return most_similar_items(matrix, vocab, term, n, missing_terms=delta)
    return []
