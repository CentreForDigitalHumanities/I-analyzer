import importlib
from importlib import util
from importlib.machinery import SourceFileLoader
import logging
import re
from os.path import isfile

from flask import current_app

from ianalyzer import models

def load_corpus(corpus_name):
    filepath = current_app.config['CORPORA'][corpus_name]

    try:
        corpus_spec = util.spec_from_file_location(
            corpus_name,
            filepath
        )
        # this is deprecated as per Python 3.6 (use importlib.utils.module_from_spec)
        # for now, assume we develop for Python 3.4
        corpus_mod = SourceFileLoader(
            corpus_name,
            filepath
        ).load_module()
    except FileNotFoundError:
        logging.critical(
            'No module describing the corpus "{0}" found in the specified file path:\
            {1}'.format(corpus_name, filepath)
        )
        return None

    corpus_spec.loader.exec_module(corpus_mod)
    # assume the class name of the endpoint is the same as the corpus name,
    # allowing for differences in camel case vs. lower case
    regex = re.compile('[^a-zA-Z]')
    corpus_name = regex.sub('', corpus_name)
    endpoint = next((attr for attr in dir(corpus_mod) if attr.lower() == corpus_name), None)
    corpus_class = getattr(corpus_mod, endpoint)
    return corpus_class()


def load_all_corpora():
    for corpus_name in current_app.config['CORPORA'].keys():
        corpus = load_corpus(corpus_name)
        if corpus:
            current_app.config['CORPUS_DEFINITIONS'][corpus_name] = corpus
            corpus_db = models.Corpus.query.filter_by(name=corpus_name).first()
            if not corpus_db:
                # add corpus to database if it's not already in
                corpus_db = models.Corpus(
                    name=corpus_name,
                    description=current_app.config['CORPUS_DEFINITIONS'][corpus_name].description
                )
                models.db.session.add(corpus_db)
                # add it to admin role, too
                admin = models.Role.query.filter_by(name='admin').first()
                admin.corpora.append(corpus_db)
                models.db.session.commit()