import nltk
import os
from langcodes import Language

HERE = os.path.abspath(os.path.dirname(__file__))
NLTK_DATA_PATH = os.path.join(HERE, 'nltk_data')

def get_language_key(language_code):
    '''
    Get the nltk stopwords file / elasticsearch stemmer name for a language code

    E.g. 'en' -> 'english'
    '''

    return Language.make(language_code).display_name().lower()

def get_nltk_stopwords(language_code):
    nltk.download('stopwords', NLTK_DATA_PATH)
    stopwords_dir = os.path.join(NLTK_DATA_PATH, 'corpora', 'stopwords')
    languages = os.listdir(stopwords_dir)
    language = get_language_key(language_code)

    if language in languages:
        filepath = os.path.join(stopwords_dir, language)
        with open(filepath) as infile:
            words = [line.strip() for line in infile.readlines()]
            return words
    else:
        raise NotImplementedError('language {} has no nltk stopwords list'.format(language))


def es_settings(languages=[], stopword_analyzer=False, stemming_analyzer=False):
    '''
    Make elasticsearch settings json for a corpus index. Options:
    - `language`: array of language codes. See addcorpus.constants for options, and which languages support stopwords/stemming
    - `stopword_analyzer`: define an analyzer that removes stopwords.
    - `stemming_analyzer`: define an analyzer that removes stopwords and performs stemming.
    '''
    settings = {'index': {'number_of_shards': 1, 'number_of_replicas': 1}}
    stopword_filter_name = 'stopwords'
    clean_analyzer_name = 'clean'
    stemmer_filter_name = 'stemmer'
    stemmed_analyzer_name = 'stemmed'
    
    for language in languages:
        add_language_string = lambda name: '{}_{}'.format(language, name) if len(languages) > 0 else name
        if stopword_analyzer or stemming_analyzer:
            set_stopword_filter(language, add_language_string(stopword_filter_name))
            
            if stopword_analyzer:
                set_clean_analyzer(language, add_language_string(stopword_filter_name), add_language_string(clean_analyzer_name))
            if stemming_analyzer:
                set_stemmed_analyzer(language, add_language_string(stemmer_filter_name), add_language_string(stemmed_analyzer_name))

    return settings

def number_filter():
    return {
        "type":"pattern_replace",
        "pattern":"\\d+",
        "replacement":""
    }

def make_stopword_filter(language, stopword_filter_name):
    stopwords = get_nltk_stopwords(language)
    return {
        "type": "stop",
        stopword_filter_name: stopwords
    }

def make_clean_analyzer(stopword_filter_name):
    return {
        "tokenizer": "standard",
        "char_filter": ["number_filter"],
        "filter": ["lowercase", stopword_filter_name]
    }

def make_stemmer_filter(language):
    stemmer_language = get_language_key(language)
    return {
        "type": "stemmer",
        "language": stemmer_language
    }

def make_stemmed_analyzer(stemmer_filter_name):
    return {
        "tokenizer": "standard",
        "char_filter": ["number_filter"],
        "filter": ["lowercase", "stopwords", stemmer_filter_name]
    }

def get_stopwords_from_settings(es_settings):
    try:
        token_filter = es_settings["analysis"]['filter']['stopwords']
        stopwords = token_filter['stopwords']
    except:
        stopwords = None

    return stopwords

def set_stemmed_analyzer(settings, language, stemmer_filter_name, stemmed_analyzer_name):
    settings['analysis']['filter'][stemmer_filter_name] = make_stemmer_filter(language)
    settings["analysis"]['analyzer'][stemmed_analyzer_name] = make_stemmed_analyzer(stemmer_filter_name)

def set_stopword_filter(settings, language, stopword_filter_name):
    settings["analysis"] = {
        "analyzer": {},
        "char_filter":{ "number_filter": number_filter() },
        'filter': {
            "stopwords": make_stopword_filter(language, stopword_filter_name)
        }
    }
    
def set_clean_analyzer(settings, language, stopword_filter_name, clean_analyzer_name):
    settings["analysis"]['analyzer'][clean_analyzer_name] = make_clean_analyzer(language, stopword_filter_name)