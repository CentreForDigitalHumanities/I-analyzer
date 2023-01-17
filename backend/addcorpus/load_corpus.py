from addcorpus.models import Corpus
from django.contrib.auth.models import Group
from django.conf import settings
import re
from os.path import abspath, dirname, isfile
from importlib import util
import logging
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


def load_all_corpora():
    for corpus_name in settings.CORPORA.keys():
        try:
            corpus = load_corpus(corpus_name)
        except Exception as e:
            message = 'Could not load corpus {}: {}'.format(corpus_name, e)
            logger.log(level = 40, msg = message)
            corpus = None

        if corpus:
            # TODO: This will not work, find a different solution
            settings.CORPUS_DEFINITIONS[corpus_name] = corpus
            corpus_db = Corpus.objects.filter(name=corpus_name).first()
            if not corpus_db:
                # add corpus to database if it's not already in
                corpus_db = Corpus(
                    name=corpus_name,
                    description=settings.CORPUS_DEFINITIONS[corpus_name].description
                )
                corpus_db.save()
                # add it to admin role, too
                admin = Group.objects.get(name='admin')
                if admin:
                    corpus_db.groups.add(admin)
                    corpus_db.save()
