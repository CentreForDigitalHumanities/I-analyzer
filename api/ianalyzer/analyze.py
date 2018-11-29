from sklearn.feature_extraction.text import CountVectorizer
import numpy as np

def make_wordcloud_data(list_of_content):
    for content in list_of_content:
        if content != '':
            list_of_content.remove(content)
    cv = CountVectorizer(stop_words="english", max_features=50)
    counts = cv.fit_transform(list_of_content).toarray().ravel()
    words = cv.get_feature_names()
    output = [{'key': word, 'doc_count': int(counts[i])+1} for i, word in enumerate(words)]
    return output