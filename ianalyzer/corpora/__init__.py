import importlib
from importlib import util
import logging

from ianalyzer import config

try:
    filepath = config.CORPORA[config.CORPUS]

    try:
        corpus_spec = util.spec_from_file_location(
            config.CORPUS,
            config.CORPORA[config.CORPUS]
        )
        corpus_mod = util.module_from_spec(corpus_spec)
        corpus_spec.loader.exec_module(corpus_mod)
        corpus_class = getattr(corpus_mod, config.CORPUS_ENDPOINT)
        corpus_obj = corpus_class()
        
    except FileNotFoundError:
        logging.critical(
            'No module describing the desired corpus found in the specified file path\
            Please verify the file path set in config.CORPORA'
        )
        raise

except KeyError:
    logging.critical('No file path for the desired corpus specified in config.CORPORA')
    raise