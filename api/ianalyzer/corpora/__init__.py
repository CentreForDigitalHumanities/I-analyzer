import importlib
from importlib import util
import logging

from ianalyzer import config


def load_corpus(corpus_name):
    try:
        filepath = config.CORPORA[corpus_name]

        try:
            corpus_spec = util.spec_from_file_location(
                corpus_name,
                config.CORPORA[corpus_name]
            )
            corpus_mod = util.module_from_spec(corpus_spec)
            corpus_spec.loader.exec_module(corpus_mod)
            # assume the class name of the endpoint is the same as the corpus name,
            # allowing for differences in casing
            [endpoint] = [attr for i, attr in enumerate(dir(corpus_mod)) if attr.lower() == corpus_name]
            corpus_class = getattr(corpus_mod, endpoint)
            return corpus_class()

        except FileNotFoundError:
            logging.critical(
                'No module describing the desired corpus found in the specified file path\
                Please verify the file path set in config.CORPORA'
            )
            raise

    except KeyError:
        logging.critical(
            'No file path for the desired corpus specified in config.CORPORA')
        raise


if not hasattr(config, 'AVAILABLE_CORPORA'):
    config.AVAILABLE_CORPORA = [config.CORPUS]

DEFINITIONS = {}
for corpus_name in config.AVAILABLE_CORPORA:
    DEFINITIONS[corpus_name] = load_corpus(corpus_name)

# default corpus
corpus_obj = DEFINITIONS[config.CORPUS]
