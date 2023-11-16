import pytest

from addcorpus.es_settings import es_settings

char_filter_tokenizer = {'char_filter': ['number_filter'], 'tokenizer': 'standard'}

test_cases = {
    'single_language': {
        'languages': ['en'],
        'stopword': True,
        'stemming': True,
        'expected': {
            'filter': {
                'stemmer_en': {'type': 'stemmer', 'language': 'english'},
                'stopwords_en': {'type': 'stop', 'stopwords': list()},
            },
            'analyzer': {
                'clean_en': {
                    'filter': ['lowercase', 'stopwords_en'],
                    **char_filter_tokenizer
                },
                'stemmed_en': {
                    'filter': ['lowercase', 'stopwords_en', 'stemmer_en'],
                    **char_filter_tokenizer
                }
            }
        }
    },
    'multiple_languages': {
        'languages': ['en', 'de'],
        'stopword': True,
        'stemming': True,
        'expected': {
            'filter': {
                'stemmer_de': {'type': 'stemmer', 'language': 'german'},
                'stopwords_de': {'type': 'stop', 'stopwords': list()},
                'stemmer_en': {'type': 'stemmer', 'language': 'english'},
                'stopwords_en': {'type': 'stop', 'stopwords': list()},
            },
            'analyzer': {
                'clean_de': {
                    'filter': ['lowercase', 'stopwords_de'],
                    **char_filter_tokenizer
                },
                'stemmed_de': {
                    'filter': ['lowercase', 'stopwords_de', 'stemmer_de'],
                    **char_filter_tokenizer
                },
                'clean_en': {
                    'filter': ['lowercase', 'stopwords_en'],
                    **char_filter_tokenizer
                },
                'stemmed_en': {
                    'filter': ['lowercase', 'stopwords_en', 'stemmer_en'],
                    **char_filter_tokenizer
                }
            }
        }
    }
}

@pytest.mark.parametrize('test_config', list(test_cases.values()))
def test_es_settings(test_config):
    settings = es_settings(test_config['languages'], test_config['stopword'], test_config['stemming'])
    assert settings['analysis']['filter'].keys() == test_config['expected']['filter'].keys()
    assert settings['analysis']['analyzer'].keys() == test_config['expected']['analyzer'].keys()
    for analyzer in settings['analysis']['analyzer'].keys():
        assert settings['analysis']['analyzer'][analyzer]['filter'][1] in settings['analysis']['filter']
        if analyzer.startswith('stemmed'):
            assert settings['analysis']['analyzer'][analyzer]['filter'][2] in settings['analysis']['filter']