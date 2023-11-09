import nltk
import os
from langcodes import Language

HERE = os.path.abspath(os.path.dirname(__file__))
NLTK_DATA_PATH = os.path.join(HERE, 'nltk_data')

# available Elasticsearch stemmers [https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-stemmer-tokenfilter.html]
AVAILABLE_ES_STEMMERS = ['arabic', 'armenian', 'basque', 'bengali', 'brazilian', 
                         'bulgarian', 'catalan', 'cjk', 'czech', 'danish', 'dutch', 
                         'english', 'estonian', 'finnish', 'french', 'galician',
                         'german', 'greek', 'hindi', 'hungarian', 'indonesian', 
                         'irish', 'italian', 'latvian', 'lithuanian', 'norwegian', 
                         'persian', 'portuguese', 'romanian', 'russian', 'sorani', 
                         'spanish', 'swedish', 'turkish', 'thai']

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

def add_language_string(name, language):
    return '{}_{}'.format(name, language) if language else name

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
    
    set_char_filter(settings)
    
    for language in languages:
        # do not attach language isocodes if there is just one language
        language_string = language if len(languages) > 1 else None

        if stopword_analyzer or stemming_analyzer:
            if not set_stopword_filter(settings, add_language_string(stopword_filter_name, language_string), language):
                continue # skip languages for which we do not have a stopword list

            if stopword_analyzer:
                set_clean_analyzer(
                    settings,
                    add_language_string(stopword_filter_name, language_string),
                    add_language_string(clean_analyzer_name, language_string),
                )
            if stemming_analyzer and get_language_key(language) in AVAILABLE_ES_STEMMERS:
                set_stemmed_analyzer(
                    settings,
                    add_language_string(stopword_filter_name, language_string),
                    add_language_string(stemmer_filter_name, language_string),
                    add_language_string(stemmed_analyzer_name, language_string),
                    language
                )

    return settings

def number_filter():
    return {
        "type":"pattern_replace",
        "pattern":"\\d+",
        "replacement":""
    }

def make_stopword_filter(stopword_filter_name, language):
    try:
        stopwords = get_nltk_stopwords(language)
        return {
            "type": "stop",
            stopword_filter_name: stopwords
        }
    except:
        return None

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

def make_stemmed_analyzer(stopword_filter_name, stemmer_filter_name):
    return {
        "tokenizer": "standard",
        "char_filter": ["number_filter"],
        "filter": ["lowercase", stopword_filter_name, stemmer_filter_name]
    }

def get_stopwords_from_settings(es_settings):
    try:
        token_filter = es_settings["analysis"]['filter']['stopwords']
        stopwords = token_filter['stopwords']
    except:
        stopwords = None

    return stopwords

def set_stemmed_analyzer(settings, stopword_filter_name, stemmer_filter_name, stemmed_analyzer_name, language):
    filters = settings['analysis'].get('filter', {})
    filters.update({stemmer_filter_name: make_stemmer_filter(language)})
    settings['analysis']['filter'] = filters
    analyzers = settings['analysis'].get('analyzer')
    analyzers.update({stemmed_analyzer_name: make_stemmed_analyzer(stopword_filter_name, stemmer_filter_name)})
    settings['analysis']['analyzer'] = analyzers

def set_char_filter(settings):
    settings["analysis"] = {
        "char_filter": { "number_filter": number_filter() }
    }

def set_stopword_filter(settings, stopword_filter_name, language):
    stopword_filter = make_stopword_filter(stopword_filter_name, language)
    if not stopword_filter:
        return False
    filters = settings['analysis'].get('filter', {})
    filters.update({
        stopword_filter_name: stopword_filter
    })
    settings['analysis']['filter'] = filters
    return True
    
def set_clean_analyzer(settings, stopword_filter_name, clean_analyzer_name):
    clean_analyzer = make_clean_analyzer(stopword_filter_name)
    analyzers = settings['analysis'].get('analyzer', {})
    analyzers.update({clean_analyzer_name: clean_analyzer})
    settings["analysis"]['analyzer'] = analyzers