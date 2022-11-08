from sklearn.preprocessing import minmax_scale
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.metrics import mean_squared_error
from sklearn.decomposition import PCA
import numpy as np
from scipy.optimize import minimize

import wordmodels.utils as utils


def model_contains_terms(terms, model):
    in_model = lambda term: utils.word_in_model(term, model)
    return any(in_model(term) for term in terms)

def find_optimal_2d_maps(binned_models, terms_per_model, wm_type):
    original_vectors = [
        np.array([utils.term_to_vector(term, model, wm_type)
        for term in terms]) if model_contains_terms(terms, model) else None
        for model, terms in zip(binned_models, terms_per_model)
    ]

    coordinates = find_optimal_coordinates(original_vectors, terms_per_model)

    data = format_final_data(coordinates, terms_per_model)
    return data

def initial_coordinates(vectors_per_timeframe, terms_per_timeframe):
    return [
        decompose_to_2d(vectors) if similarities_defined(vectors) else np.array([[0.0, 0.0]])
        for vectors, terms in zip(vectors_per_timeframe, terms_per_timeframe)
    ]

def similarities_defined(vectors):
    """
    Checks if the vector result can be used to compare similarities. This requires
    that the object contains any vectors, and the number of samples is greater than 1.
    """
    return type(vectors) != type(None) and vectors.shape[0] > 1

def decompose_to_2d(vectors):
    """
    Decompose the vectors for one timeframe to a 2d map using PCA
    """

    pca = PCA(n_components=2)
    decomposed = pca.fit_transform(vectors)

    return decomposed

def parameters_from_coordinates(coordinates_per_timeframe):
    return [
        coordinate
        for coordinates in coordinates_per_timeframe
        for coordinate in np.nditer(coordinates)
    ]

def coordinates_from_parameters(parameters, terms_per_timeframe):
    start_slice = lambda index : sum(len(terms) for terms in terms_per_timeframe[:index])
    slice_per_timeframe = [
        (start_slice(index) * 2, (start_slice(index) + len(terms)) * 2)
        for index, terms in enumerate(terms_per_timeframe)
    ]
    parameters_per_timeframe = [
        np.array(parameters[start:stop])
        for start, stop in slice_per_timeframe
    ]
    coordinates_per_timeframe = [
        p.reshape(int(p.size / 2), 2)
        for p in parameters_per_timeframe
    ]
    return coordinates_per_timeframe

def find_optimal_coordinates(vectors_per_timeframe, terms_per_timeframe):
    initial = initial_coordinates(vectors_per_timeframe, terms_per_timeframe)
    parameters = parameters_from_coordinates(initial)
    options = {
        'maxiter': 10000
    }

    evaluation = lambda params: evaluate_coordinates(coordinates_from_parameters(params, terms_per_timeframe), vectors_per_timeframe, terms_per_timeframe)

    res = minimize(evaluation, parameters, method = 'nelder-mead', options=options)
    final = coordinates_from_parameters(res.x, terms_per_timeframe)
    return final

def evaluate_coordinates(coordinates_per_timeframe, vectors_per_timeframe, terms_per_timeframe):
    similarity_loss = total_similarity_loss(coordinates_per_timeframe, vectors_per_timeframe)
    alignment_loss = total_alignment_loss(coordinates_per_timeframe, terms_per_timeframe)
    loss = similarity_loss + alignment_loss

    return loss

def total_similarity_loss(coordinates_per_timeframe, vectors_per_timeframe):
    loss_per_timeframe = [
        similarity_loss(vectors, coordinates)
        for coordinates, vectors in zip(coordinates_per_timeframe, vectors_per_timeframe)
    ]

    return sum(loss_per_timeframe)

def similarity_loss(original_vectors, coordinates):
    """
    Given a numpy array of the original term vectors and a numpy array of new coordinates
    (presumably a 2d map), give the loss over the similarity between terms.
    This is the squared difference in the cosine similarity between each pair of terms.
    """

    if not similarities_defined(original_vectors):
        return 0.0

    vector_similarities = pairwise_similarities(original_vectors)
    coordinate_similarities = pairwise_similarities(coordinates)

    loss = mean_squared_error(vector_similarities, coordinate_similarities)
    return loss

def pairwise_similarities(vectors):
    """
    Given a 2d matrix, calculate the cosine similarity between each pair of rows
    and return a vector of similarity scores.
    Pairing is deterministic, so output between matrices of the same length can be compared.
    """

    n_rows = vectors.shape[0]
    pairs = [(i, j) for i in range(n_rows) for j in range(n_rows) if i < j]

    all_similarities = cosine_similarity(vectors, vectors)
    unique_similarities = np.array([all_similarities[i, j] for i, j in pairs])
    return unique_similarities


def total_alignment_loss(coordinates_per_timeframe, terms_per_timeframe):
    """
    Given the list of terms per timeframe and coordinates per timeframe,
    quantify how much terms shift between adjacent timeframe.
    This is the squared difference in position for each term between each
    pair of adjacent timeframes.
    """

    transition_pairs = [(i, i+1) for i in range(len(terms_per_timeframe) - 1)]

    loss_per_transition = [
        alignment_loss_adjacent_timeframes(
            coordinates_per_timeframe[i],
            terms_per_timeframe[i],
            coordinates_per_timeframe[j],
            terms_per_timeframe[j]
        )
        for i,j in transition_pairs
    ]

    return sum(loss_per_transition)

def alignment_loss_adjacent_timeframes(coordinates_1, terms_1, coordinates_2, terms_2):
    """
    Calculate the alingment loss for two adjacent timeframes
    """

    terms_to_index = lambda terms : { term: index for index, term in enumerate(terms) }
    terms_to_index_1 = terms_to_index(terms_1)
    terms_to_index_2 = terms_to_index(terms_2)

    common_terms = list(set.intersection(set(terms_1), set(terms_2)))

    filter_coordinates = lambda coordinates, terms_to_index : np.array([
        coordinates[terms_to_index[term], :]
        for term in common_terms
    ])

    filtered_coordinates_1 = filter_coordinates(coordinates_1, terms_to_index_1)
    filtered_coordinates_2 = filter_coordinates(coordinates_2, terms_to_index_2)

    loss = mean_squared_error(filtered_coordinates_1, filtered_coordinates_2)

    return loss

def format_final_data(coordinates_per_timeframe, terms_per_timeframe):
    """
    Convert the final data to a nice format. Convert to chartJS-friendly format,
    convert np.float to float, and scale values to [-1, 1] range.
    """

    scaled_coordinates = [scale_values(coordinates) for coordinates in coordinates_per_timeframe]

    data = [
        [
            {
                'label': term,
                'x': float(coordinates[i, 0]),
                'y': float(coordinates[i, 1])
            }
            for i, term in enumerate(terms)
        ]
        for terms, coordinates in zip(terms_per_timeframe, scaled_coordinates)
    ]

    return data


def scale_values(values):
    """
    Scale each dimension to [-1, 1 range]
    """

    return minmax_scale(values, feature_range = (-1, 1))
