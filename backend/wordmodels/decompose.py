from sklearn.manifold import TSNE
from sklearn.preprocessing import minmax_scale
import numpy as np
import random

from wordmodels.similarity import query_vector

def map_to_2d(words, model):
    decomposed = make_2d(words, model)
    scaled = scale_values(decomposed)

    return [
        {
            'label': word,
            'x': float(scaled[i, 0]),
            'y': float(scaled[i, 1]),
        }
        for i, word in enumerate(words)
    ]

def make_2d(words, model):
    transformer = model['transformer']
    matrix = model['svd_ppmi']

    data = np.array([
        query_vector(term, transformer, matrix)
        for term in words
    ])

    tsne = TSNE(n_components=2)
    return tsne.fit_transform(data)

def scale_values(values):
    """
    Scale each dimension to [-1, 1 range]
    """

    return minmax_scale(values, feature_range = (-1, 1))
