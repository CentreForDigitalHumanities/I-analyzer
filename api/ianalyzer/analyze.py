
import os
import pickle
# as per Python 3, pickle uses cPickle under the hood

from sklearn.feature_extraction.text import CountVectorizer
import numpy as np
import scipy

from . import config_fallback as config

def make_wordcloud_data(list_of_content):
    cv = CountVectorizer(stop_words="english", max_features=50)
    counts = cv.fit_transform(list_of_content).toarray().ravel()
    words = cv.get_feature_names()
    output = [{'key': word, 'doc_count': int(counts[i])+1} for i, word in enumerate(words)]
    return output


def get_diachronic_contexts(query_term, corpus, number_similar=5):
    try:
        wm_directory = config.WM_DIRECTORY[corpus]
    except KeyError:
        return "There are no word models for this corpus."
    complete, binned = load_data(
        wm_directory,
        config.WM_COMPLETE_FN,
        config.WM_BINNED_FN
    )
    word_list = find_n_most_similar(
        complete['svd_ppmi'],
        complete['transformer'],
        query_term,
        number_similar)
    if not word_list:
        return "The query term is not in the word models' vocabulary."
    times = []
    words = [word['key'] for word in word_list]
    word_data = [{'label': word, 'data': []} for word in words]
    for time_bin in binned:
        word_data = similarity_with_top_terms(
            time_bin['svd_ppmi'],
            time_bin['transformer'],
            query_term,
            word_data)
        times.append(np.mean(
            [time_bin['start_year'], time_bin['end_year']]))
    return word_list, word_data, times


def load_data(directory, complete_fn, binned_fn):
    with open(os.path.join(directory,complete_fn), "rb") as f:
        complete = pickle.load(f)
    with open(os.path.join(directory,binned_fn), "rb") as f:
        binned = pickle.load(f)
    return complete, binned


def find_n_most_similar(matrix, transformer, query_term, n):
    """given a matrix of svd_ppmi values 
    and the transformer (i.e., sklearn CountVectorizer),
    determine which n terms match the given query term best
    """
    index = next(
        (i for i, a in enumerate(transformer.get_feature_names())
         if a == query_term), None)
    if not(index):
        print("query term not found")
        return None
    vec = matrix[:, index]
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
    query_index = next(
            (i for i, a in enumerate(transformer.get_feature_names())
             if a == query_term), None)
    query_vec = matrix[:, query_index]
    for item in word_data:
        index = next(
            (i for i, a in enumerate(transformer.get_feature_names())
             if a == item['label']), None)
        if not index:
            value = 0
        else:
            value = cosine_similarity_vectors(matrix[:, index], query_vec)
        item['data'].append(value)
    return word_data

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