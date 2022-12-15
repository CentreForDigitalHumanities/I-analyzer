from sklearn.preprocessing import minmax_scale
from sklearn.metrics import mean_squared_error
from sklearn.decomposition import PCA
import numpy as np
from scipy.optimize import minimize
import wordmodels.utils as utils
from math import radians, cos, sin


def model_contains_terms(terms, model):
    in_model = lambda term: utils.word_in_model(term, model)
    return any(in_model(term) for term in terms)

def find_optimal_2d_maps(binned_models, terms_per_model):
    original_vectors = [
        np.array([utils.term_to_vector(term, model)
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

def coordinates_from_parameters(parameters, initial_coordinates):
    angles = [ sum(parameters[:i+1]) for i in range(len(parameters)) ]
    coordinates_per_timeframe = rotate_coordinates(initial_coordinates, angles)
    return coordinates_per_timeframe

def find_optimal_coordinates(vectors_per_timeframe, terms_per_timeframe):
    initial = initial_coordinates(vectors_per_timeframe, terms_per_timeframe)

    find_rotation = lambda time_index : find_optimal_rotation(
        initial[time_index], terms_per_timeframe[time_index],
        initial[time_index - 1], terms_per_timeframe[time_index - 1]
    ) if time_index > 0 else 0

    parameters = [ find_rotation(i) for i in range(len(initial)) ]
    final = coordinates_from_parameters(parameters, initial)
    return final

def find_optimal_rotation(coordinates, terms, previous_coordinates, previous_terms):
    '''
    Find the optimal rotation for a 2D map, minimising the difference with the
    previous set of coordinates.
    '''

    evaluation = lambda params: alignment_loss_adjacent_timeframes(
        rotate_coordinates_in_timeframe(coordinates, params[0]),
        terms,
        previous_coordinates,
        previous_terms
    )

    parameters = [0]
    options = { 'maxiter': 10000 }
    res = minimize(evaluation, parameters, method = 'nelder-mead', options = options)

    angle = res.x[0]
    return angle

def rotate_coordinates(coordinates_per_timeframe, angle_per_timeframe):
    return [
        rotate_coordinates_in_timeframe(coordinates, angle)
        for coordinates, angle in zip(coordinates_per_timeframe, angle_per_timeframe)
    ]

def rotate_coordinates_in_timeframe(coordinates, angle):
    r = radians(-angle)
    rotation_matrix = np.array([
        [cos(r), -sin(r)],
        [sin(r), cos(r)]
    ])
    rotated_coordinates = np.dot(coordinates, np.transpose(rotation_matrix))
    return rotated_coordinates

def alignment_loss_adjacent_timeframes(coordinates_1, terms_1, coordinates_2, terms_2):
    """
    Calculate the alingment loss for two adjacent timeframes
    """

    terms_to_index = lambda terms : { term: index for index, term in enumerate(terms) }
    terms_to_index_1 = terms_to_index(terms_1)
    terms_to_index_2 = terms_to_index(terms_2)

    common_terms = list(set.intersection(set(terms_1), set(terms_2)))

    if len(common_terms):
        filter_coordinates = lambda coordinates, terms_to_index : np.array([
            coordinates[terms_to_index[term], :]
            for term in common_terms
        ])

        filtered_coordinates_1 = filter_coordinates(coordinates_1, terms_to_index_1)
        filtered_coordinates_2 = filter_coordinates(coordinates_2, terms_to_index_2)

        loss = mean_squared_error(filtered_coordinates_1, filtered_coordinates_2)
    else:
        loss = 0

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
