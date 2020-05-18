from os.path import abspath, dirname, isfile
import importlib
from importlib import util
from importlib.machinery import SourceFileLoader
import logging
logger = logging.getLogger(__name__)
import re

from flask import current_app

from ianalyzer import models


def corpus_dir(corpus_name):
    """Gets the absolute path to the corpus definition directory

    Arguments:
        corpus_name {str} -- Name of the corpus
    """
    return abspath(dirname(current_app.config['CORPORA'][corpus_name]))


def load_corpus(corpus_name):
    filepath = abspath(current_app.config['CORPORA'][corpus_name])

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
