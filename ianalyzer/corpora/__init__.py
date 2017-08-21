import importlib
import logging

from ianalyzer import config


try:
    corpus_mod = importlib.import_module(
        ".{}".format(config.CORPUS), "ianalyzer.corpora"
    )
    
    corpus_obj = getattr(corpus_mod, config.CORPUS_ENDPOINT)
    
except ImportError:
    logging.critical(
        'No module describing the desired corpus found'
    )
    raise