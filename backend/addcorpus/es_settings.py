import nltk
import os

HERE = os.path.abspath(os.path.dirname(__file__))
NLTK_DATA_PATH = os.path.join(HERE, 'nltk_data')

SETTINGS = {
    'index': {'number_of_replicas': 0},
    "analysis": {
        "analyzer": {
            "clean": {
                "tokenizer": "standard",
                "char_filter": ["number_filter"],
                "filter": ["lowercase", "stopwords"]
            },
            "stemmed": {
                "tokenizer": "standard",
                "char_filter": ["number_filter"],
                "filter": ["lowercase", "stopwords", "stemmer"]
            }
        },
        "char_filter":{
            "number_filter":{
                "type":"pattern_replace",
                "pattern":"\\d+",
                "replacement":""
            }
        }
    }
}

def get_nltk_stopwords(language):
    nltk.download('stopwords', NLTK_DATA_PATH)
    stopwords_dir = os.path.join(NLTK_DATA_PATH, 'corpora', 'stopwords')
    languages = os.listdir(stopwords_dir)

    if language in languages:
        filepath = os.path.join(stopwords_dir, language)
        with open(filepath) as infile:
            words = [line.strip() for line in infile.readlines()]
            return words
    else:
        raise NotImplementedError('language {} has no nltk stopwords list'.format(language))


def es_settings(language = None, stopword_analyzer = False, stemming_analyzer = False):
    '''
    Make elasticsearch settings json for a corpus index. Options:
    - `language`: string with the language of the corpus. Must be specified if you want to use stopword or stemming analysers.
    - `stopword_analyzer`: define an analyser that removes stopwords.
    - `stemming_analyzer`: define an analyser that removes stopwords and performs stemming.
    '''
    settings = {}

    if stopword_analyzer or stemming_analyzer:
        settings["analysis"] = {
            "analyzer": {},
            "char_filter":{ "number_filter": number_filter() },
            'filter': {
                "stopwords": make_stopword_filter(language)
            }
        }

        if stopword_analyzer:
            settings["analysis"]['analyzer']['clean'] = make_stopword_analyzer()

        if stemming_analyzer:
            settings['analysis']['filter']['stemmer'] = make_stemmer_filter(language)
            settings["analysis"]['analyzer']['stemmed'] = make_stemmed_analyzer()

    return settings

def number_filter():
    return {
        "type":"pattern_replace",
        "pattern":"\\d+",
        "replacement":""
    }

def make_stopword_filter(language):
    stopwords = get_nltk_stopwords(language)
    return {
        "type": "stop",
        "stopwords": stopwords
    }

def make_stopword_analyzer():
    return {
        "tokenizer": "standard",
        "char_filter": ["number_filter"],
        "filter": ["lowercase", "stopwords"]
    }

def make_stemmer_filter(language):
    return {
        "type": "stemmer",
        "language": language
    }

def make_stemmed_analyzer():
    return {
        "tokenizer": "standard",
        "char_filter": ["number_filter"],
        "filter": ["lowercase", "stopwords", "stemmer"]
    }
