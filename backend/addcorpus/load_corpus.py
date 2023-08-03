from addcorpus.models import Corpus, Field
from addcorpus.corpus import CorpusDefinition, FieldDefinition
from django.contrib.auth.models import Group
from django.conf import settings
import re
from os.path import abspath, dirname
from importlib import util
import logging
import sys
logger = logging.getLogger(__name__)


def corpus_path(corpus_name):
    return abspath(settings.CORPORA.get(corpus_name))

def corpus_dir(corpus_name):
    """Gets the absolute path to the corpus definition directory

    Arguments:
        corpus_name {str} -- Key of the corpus in CORPORA object in settings
    """
    return dirname(corpus_path(corpus_name))

def load_corpus(corpus_name):
    filepath = corpus_path(corpus_name)

    try:
        corpus_spec = util.spec_from_file_location(
            corpus_name,
            filepath)

        corpus_mod = util.module_from_spec(corpus_spec)
    except FileNotFoundError:
        logger.critical(
            'No module describing the corpus "{0}" found in the specified file path:\
            {1}'.format(corpus_name, filepath)
        )
        raise

    corpus_spec.loader.exec_module(corpus_mod)
    # assume the class name of the endpoint is the same as the corpus name,
    # allowing for differences in camel case vs. lower case
    regex = re.compile('[^a-zA-Z]')
    corpus_name = regex.sub('', corpus_name)
    endpoint = next((attr for attr in dir(corpus_mod)
                     if attr.lower() == corpus_name), None)
    corpus_class = getattr(corpus_mod, endpoint)
    return corpus_class()

def _try_loading_corpus(corpus_name, stderr=sys.stderr):
    try:
        return load_corpus(corpus_name)
    except Exception as e:
        message = 'Could not load corpus {}: {}'.format(corpus_name, e)
        print(message, file=stderr)

def load_all_corpora(stderr=sys.stderr):
    '''
    Return a dict with corpus names and corpus definition objects.
    '''
    corpus_definitions_unfiltered = {
        corpus_name: _try_loading_corpus(corpus_name, stderr)
        for corpus_name in settings.CORPORA.keys()
    }

    # filter any corpora without a valid definition
    corpus_definitions = {
        name: definition
        for name, definition in corpus_definitions_unfiltered.items()
        if definition
    }

    return corpus_definitions
