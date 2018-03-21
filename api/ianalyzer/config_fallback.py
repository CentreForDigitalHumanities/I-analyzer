"""
Module to fallback to the default configuration for missing settings.
"""
from ianalyzer.default_config import *
from ianalyzer.config import *

# Assign all the unassigned corpora to the default server
for corpus in CORPORA.keys():
    if not corpus in CORPUS_SERVER_NAMES:
        CORPUS_SERVER_NAMES[corpus] = 'default'

