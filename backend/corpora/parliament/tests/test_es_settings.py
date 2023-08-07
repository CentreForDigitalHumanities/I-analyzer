import addcorpus.es_settings as es_settings
from addcorpus.load_corpus import load_corpus
import pytest
import os
import shutil

def test_stopwords(clean_nltk_data_directory):
    """
    Check that stopwords results are valid and all languages are included
    """

    cases = [
        {
            'language': 'en',
            'stopwords': ['the', 'i', 'have']
        },
        {
            'language': 'nl',
            'stopwords': ['ik']
        },
        {
            'language': 'de',
            'stopwords': ['ich']
        },
        {
            'language': 'fr',
            'stopwords': ['je']
        },
        {
            'language': 'da',
            'stopwords': ['jeg']
        },
        {
            'language': 'no',
            'stopwords': ['jeg']
        },
        {
            'language': 'sv',
            'stopwords': ['jag']
        },
        {
            'language': 'fi',
            'stopwords': ['minä']
        }
    ]

    for case in cases:
        stopwords = es_settings.get_nltk_stopwords(case['language'])
        for word in case['stopwords']:
            assert word in stopwords


@pytest.fixture
def clean_nltk_data_directory():
    """
    Temporarily move already downloaded nltk_data if it was already downloaded,
    and restore the nltk_data directory after testing. If no nltk_data folder existed,
    data downloaded during testing will also be removed when done.
    """
    data_path = es_settings.NLTK_DATA_PATH

    if os.path.isdir(data_path):
        # remove already downloaded data
        temp_path = os.path.join(es_settings.HERE, '_nltk_data_temp')
        shutil.move(data_path, temp_path)

        yield data_path

        # clear test data
        if os.path.exists(data_path):
            shutil.rmtree(data_path)

        # move the old data back
        shutil.move(temp_path, data_path)
    else:
        yield data_path

        # clear test data
        if os.path.isdir(data_path):
            shutil.rmtree(data_path)
