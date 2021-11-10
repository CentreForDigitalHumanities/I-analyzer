
import enum
import os
from os.path import join
import pickle
# as per Python 3, pickle uses cPickle under the hood

from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from addcorpus.load_corpus import corpus_dir
import numpy as np
import scipy
import json
import re
from datetime import date, datetime
from ianalyzer.factories.elasticsearch import elasticsearch

from flask import current_app

NUMBER_SIMILAR = 8
WINDOW_SIZE = 3

def make_wordcloud_data(documents, field):
    texts = []
    for document in documents:
        content = document['_source'][field]
        if content and content != '':
            texts.append(content)
    # token_pattern allows 3 to 30 characters now (exluding numbers and whitespace)
    cv = CountVectorizer(max_df=0.7, token_pattern=r'(?u)\b[^0-9\s]{3,30}\b', max_features=50)
    counts = cv.fit_transform(texts).toarray().ravel()
    words = cv.get_feature_names()
    output = [{'key': word, 'doc_count': int(counts[i])+1} for i, word in enumerate(words)]
    return output


def get_diachronic_contexts(query_term, corpus, number_similar=NUMBER_SIMILAR):
    complete = load_word_models(corpus, current_app.config['WM_COMPLETE_FN'])
    binned = load_word_models(corpus, current_app.config['WM_BINNED_FN'])
    word_list = find_n_most_similar(
        complete['svd_ppmi'],
        complete['transformer'],
        query_term,
        number_similar)
    if not word_list:
        return "The query term is not in the word models' vocabulary. \
        Is your query field empty, does it contain multiple words, or did you search for a stop word?"
    times = []
    words = [word['key'] for word in word_list]
    word_data = [{'label': word, 'data': []} for word in words]
    for time_bin in binned:
        word_data = similarity_with_top_terms(
            time_bin['svd_ppmi'],
            time_bin['transformer'],
            query_term,
            word_data)
        times.append(str(time_bin['start_year'])+"-"+str(time_bin['end_year']))
    return word_list, word_data, times


def get_context_time_interval(query_term, corpus, which_time_interval, number_similar=NUMBER_SIMILAR):
    """ Given a query term and corpus, and a number indicating the mean of the requested time interval,
    return a word list of number_similar most similar words.
    """
    binned = load_word_models(corpus, current_app.config['WM_BINNED_FN'])
    time_bin = next((time for time in binned if time['start_year']==int(which_time_interval[:4]) and
        time['end_year']==int(which_time_interval[-4:])), None)
    word_list = find_n_most_similar(time_bin['svd_ppmi'],
        time_bin['transformer'],
        query_term,
        number_similar)
    if not word_list:
        return "The query term is not in the word models' vocabulary."
    word_data = [{'label': word['key'], 'data': [word['similarity']]} for word in word_list]
    return word_data


def load_word_models(corpus, path):
    try:
        wm_directory = join(corpus_dir(corpus), current_app.config['WM_PATH'])
    except KeyError:
        return "There are no word models for this corpus."
    with open(os.path.join(wm_directory, path), "rb") as f:
        wm = pickle.load(f)
    return wm


def find_n_most_similar(matrix, transformer, query_term, n):
    """given a matrix of svd_ppmi values
    and the transformer (i.e., sklearn CountVectorizer),
    determine which n terms match the given query term best
    """
    index = next(
        (i for i, a in enumerate(transformer.get_feature_names())
         if a == query_term), None)
    if not(index):
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

def get_collocations(es_query, corpus):
    """Given a query and a corpus, get the words that occurred most frequently around the query term"""

    # get time bins

    datefilter = next((f for f in es_query['query']['bool']['filter'] if 'range' in f and 'date' in f['range']), None)

    if datefilter:
        data = datefilter['range']['date']
        min_year = datetime.strptime(data['gte'], '%Y-%m-%d').year
        max_year = datetime.strptime(data['lte'], '%Y-%m-%d').year
    else:
        # TO DO: get min and max year from corpus
        min_year = 1800
        max_year = 2020
        
    time_range = max_year - min_year

    if time_range <= 20:
        year_step = 1
    elif time_range <= 100:
        year_step = 5
    else: 
        year_step = 10

    bins = range(min_year, max_year, year_step)
    time_labels = ['{}-{}'.format(year, min(max_year, year + year_step)) for year in bins]

    # find collocations

    hits = highlight_search(corpus, es_query)
    docs = highlights_by_time_interval(hits, bins)
    collocations = count_collocations(docs)

    return { 'words': collocations, 'time_points' : time_labels }


def highlight_search(corpus, es_query):
    es_query['highlight'] = {
        'number_of_fragments': 10,
        'fragment_size': 250,
        'fields': {
            '*': {} 
        },
    }

    client = elasticsearch(corpus)
    search_results = client.search(
        index=corpus,
        body = es_query,
    )

    return search_results['hits']['hits']


def highlights_by_time_interval(hits, bins):
    docs = ['' for year in bins]

    # remove queryterm (and surrounding html tags)

    for hit in hits:
        date = hit['_source']['date']
        hit_year = int(date[:4])

        for (i, bin_year) in enumerate(reversed(bins)):
            if hit_year >= bin_year:
                highlights = [extract_tokens_from_highlight(highlight) 
                    for field in hit['highlight'] for highlight in hit['highlight'][field]]
                docs[i] += ' ' + ' '.join(highlights)
                break

    return docs


def extract_tokens_from_highlight(highlight):
    # TODO: use better tokenizer
    tokens = highlight.split()
    match_indices = (i for i, token in enumerate(tokens) if re.search(r'^<em>.*</em>$', token))
    res = []

    for index in match_indices:
        window = tokens[max(0, index - WINDOW_SIZE): min(len(tokens), index + WINDOW_SIZE)]
        for token in window:
            if not (re.search(r'^<em>.*</em>$', token)):
                res.append(token)
    
    return ' '.join(res)


def count_collocations(highlights):
    cv = CountVectorizer( max_features=10)
    counts = cv.fit_transform(highlights).toarray()
    words = cv.get_feature_names()
    output = [{
            'label': word, 
            'data': list(int(count) for count in counts[:,i])
        } 
        for i, word in enumerate(words)]

    return output
