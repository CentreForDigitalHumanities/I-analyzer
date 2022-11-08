import numpy as np

from wordmodels.utils import transform_query, term_to_vector, index_to_term, word_in_model

def cosine_similarity_vectors(array1, array2):
    dot = np.inner(array1, array2)
    vec1_norm = np.linalg.norm(array1)
    vec2_norm = np.linalg.norm(array2)
    return dot / (vec1_norm * vec2_norm)

def cosine_similarity_matrix_vector(vector, matrix):
    dot = vector.dot(matrix)
    matrix_norms = np.linalg.norm(matrix, axis=0)
    vector_norm = np.linalg.norm(vector)
    matrix_vector_norms = np.multiply(matrix_norms, vector_norm)
    return dot / matrix_vector_norms

def term_similarity(wm, wm_type, term1, term2):
    matrix = wm[wm_type]

    if wm_type == 'svd_ppmi':
        transformer = wm['transformer']
        vec1 = term_to_vector(term1, wm, wm_type)
        vec2 = term_to_vector(term2, wm, wm_type)

        if type(vec1) != type(None) and type(vec2) != type(None):
            return float(cosine_similarity_vectors(vec1, vec2))

    elif wm_type == 'word2vec':
        analyzer = wm['analyzer']
        transformed1 = transform_query(term1, analyzer)
        transformed2 = transform_query(term2, analyzer)
        vocab = wm['vocab']
        if transformed1 in vocab and transformed2 in vocab:
            similarity = matrix.similarity(transformed1, transformed2)
            return float(similarity)

def find_n_most_similar(wm, wm_type, query_term, n):
    """given a matrix of svd_ppmi or word2vec values
    with its vocabulary and analyzer,
    determine which n terms match the given query term best
    """
    analyzer = wm['analyzer']
    vocab = wm['vocab']
    transformed_query = transform_query(query_term, analyzer)
    matrix = wm[wm_type]
    if wm_type == 'svd_ppmi':
        vec = term_to_vector(query_term, wm, wm_type)

        if type(vec) == type(None):
            return None

        similarities = cosine_similarity_matrix_vector(vec, matrix)
        sorted_sim = np.sort(similarities)
        most_similar_indices = np.where(similarities >= sorted_sim[-n])
        return [{
            'key': index_to_term(index, vocab),
            'similarity': similarities[index]
            } for index in most_similar_indices[0] if
            index_to_term(index, vocab)!=transformed_query
        ]
    elif wm_type == 'word2vec':
        try:
            most_similar = matrix.most_similar(transformed_query, topn=n)
            valid_term = lambda res : word_in_model(res[0], wm)
            results = filter(valid_term, most_similar)
        except:
            return None

        return [{
            'key': result[0],
            'similarity': result[1]
        } for result in results]

