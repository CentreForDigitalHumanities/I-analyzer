
import enum
import os
from os.path import join
import math
import pickle
# as per Python 3, pickle uses cPickle under the hood

from collections import Counter
from sklearn.feature_extraction.text import CountVectorizer
from addcorpus.load_corpus import corpus_dir, load_corpus
import numpy as np
from datetime import datetime
from ianalyzer.factories.elasticsearch import elasticsearch

from flask import current_app

NUMBER_SIMILAR = 8

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

def get_ngrams(es_query, corpus, field, ngram_size=2, term_positions=[0,1], freq_compensation=True, subfield='none', max_size_per_interval=50):
    """Given a query and a corpus, get the words that occurred most frequently around the query term"""

    bins = get_time_bins(es_query, corpus)
    time_labels = ['{}-{}'.format(start_year, end_year) for start_year, end_year in bins]

    # find ngrams

    docs = tokens_by_time_interval(corpus, es_query, field, bins, ngram_size, term_positions, subfield, max_size_per_interval)
    ngrams = count_ngrams(docs, freq_compensation)

    return { 'words': ngrams, 'time_points' : time_labels }


def get_time_bins(es_query, corpus):
    """Time bins for a query. Depending on the total time range of the query, time intervervals are
    10 years (>100 yrs), 5 years (100-20 yrs) of 1 year (<20 yrs)."""
    datefilter = next((f for f in es_query['query']['bool']['filter'] if 'range' in f and 'date' in f['range']), None)

    if datefilter:
        data = datefilter['range']['date']
        min_year = datetime.strptime(data['gte'], '%Y-%m-%d').year
        max_year = datetime.strptime(data['lte'], '%Y-%m-%d').year
    else:
        corpus_class = load_corpus(corpus)
        min_year = corpus_class.min_date.year
        max_year = corpus_class.max_date.year
        
    time_range = max_year - min_year

    if time_range <= 20:
        year_step = 1
    elif time_range <= 100:
        year_step = 5
    else: 
        year_step = 10

    bins = [(start, min(max_year, start + year_step - 1)) for start in range(min_year, max_year, year_step)]
    return bins


def tokens_by_time_interval(corpus, es_query, field, bins, ngram_size, term_positions, subfield, max_size_per_interval):
    client = elasticsearch(corpus)
    output = []

    query_text = es_query['query']['bool']['must']['simple_query_string']['query']
    field = field if subfield == 'none' else '.'.join([field, subfield])
    print(field)
    analyzed_query_text = client.indices.analyze(
        index = corpus,
        body={
            'text': query_text,
            'field': field,
        },
    )
    query_tokens = [token['token'] for token in analyzed_query_text['tokens']]

    for (start_year, end_year) in bins:
        start_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31)

        # filter query on this time bin
        if 'filter' not in es_query['query']['bool']:
            es_query['bool']['filter'] = []
        filters = [f for f in es_query['query']['bool']['filter'] if 'range' not in f or 'date' not in f['range']]
        filters.append({
            'range': {
                'date': {
                    'gte': datetime.strftime(start_date, '%Y-%m-%d'),
                    'lte': datetime.strftime(end_date, '%Y-%m-%d'),
                    'format': 'yyyy-MM-dd',
                }
            }
        })
        es_query['query']['bool']['filter'] = filters

        #search for the query text
        search_results = client.search(
            index=corpus,
            size = max_size_per_interval,
            body = es_query,
        )

        bin_output = []

        for hit in search_results['hits']['hits']:
            id = hit['_id']

            # get the term vectors for the hit
            termvectors = client.termvectors(
                index=corpus,
                doc_type='_doc',
                id=id,
                term_statistics=True,
                fields = [field]
            )

            if field in termvectors['term_vectors']:
                terms = termvectors['term_vectors'][field]['terms']
                
                all_tokens = [{'position': token['position'], 'term': term, 'ttf': terms[term]['ttf'] }
                    for term in terms for token in terms[term]['tokens']]
                sorted_tokens = sorted(all_tokens, key=lambda token: token['position'])

                for i, token in enumerate(sorted_tokens):
                    if token['term'] in query_tokens:
                        for j in term_positions:
                            start = i - j
                            stop = i - j + ngram_size
                            if start >= 0 and stop <= len(sorted_tokens):
                                ngram = sorted_tokens[start:stop]
                                words = ' '.join([token['term'] for token in ngram])
                                ttf = sum(token['ttf'] for token in ngram) / len(ngram)
                                bin_output.append((words, ttf))

        # output per bin: all tokens from this time interval
        output.append(bin_output)

    return output

def count_ngrams(docs, divide_by_tff):
    counters = [Counter(doc) for doc in docs]

    total_counter = Counter()
    for c in counters:
        total_counter.update(c)
        
    if divide_by_tff:
        score = lambda f, ttf : f / ttf
        relative_total_counter = {(word, ttf): score(total_counter[(word, ttf)], ttf) for (word, ttf) in total_counter}
        words = sorted(relative_total_counter.keys(), key=lambda word : relative_total_counter[word], reverse=True)[:10]
    else:
        score = lambda f, ttf: f
        words = [word for word, count in total_counter.most_common(10)]


    output = [{
            'label': word[0],
            'data': [score(c[word], word[1])
                for c in counters]
        }
        for word in words]

    return output
