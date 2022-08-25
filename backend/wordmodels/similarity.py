import numpy as np

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

def term_similarity(matrix, transformer, term1, term2):
    vec1 = term_vector(matrix, transformer, term1)
    vec2 = term_vector(matrix, transformer, term2)

    if type(vec1) != type(None) and type(vec2) != type(None):
        return float(cosine_similarity_vectors(vec1, vec2))

def term_vector(matrix, transformer, term):
    index = next(
        (i for i, a in enumerate(transformer.get_feature_names())
         if a == term), None)
    if not(index):
        return None
    vec = matrix[:, index]
    return vec

def find_n_most_similar(matrix, transformer, query_term, n):
    """given a matrix of svd_ppmi values
    and the transformer (i.e., sklearn CountVectorizer),
    determine which n terms match the given query term best
    """
    vec = term_vector(matrix, transformer, query_term)
    if type(vec) == type(None):
        return None

    similarities = cosine_similarity_matrix_vector(vec, matrix)
    sorted_sim = np.sort(similarities)
    most_similar_indices = np.where(similarities >= sorted_sim[-n])
    output_terms = [{
        'key': transformer.get_feature_names()[index],
        'similarity': similarities[index]
        } for index in most_similar_indices[0] if
        transformer.get_feature_names()[index]!=query_term
    ]
    return output_terms


def similarity_with_top_terms(matrix, transformer, query_term, word_data):
    """given a matrix of svd_ppmi values,
    the transformer (i.e., sklearn CountVectorizer), and a word list
    of the terms matching the query term best over the whole corpus,
    determine the similarity for each time interval
    """
    query_vec = term_vector(matrix, transformer, query_term)
    for item in word_data:
        item_vec = term_vector(matrix, transformer, item['label'])
        if type(item_vec) == type(None):
            value = 0
        else:
            value = cosine_similarity_vectors(item_vec, query_vec)
        item['data'].append(value)
    return word_data
