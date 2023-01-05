import nltk
import os

HERE = os.path.abspath(os.path.dirname(__file__))
NLTK_DATA_PATH = os.path.join(HERE, 'nltk_data')

SETTINGS = {
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

def get_language_specific_es_settings(language):
    stopwords = get_nltk_stopwords(language)

    settings = SETTINGS
    settings['analysis']['filter'] = {
        "stopwords": {
            "type": "stop",
            "stopwords": stopwords
        },
        "stemmer": {
            "type": "stemmer",
            "language": language
        }
    }

    return settings
