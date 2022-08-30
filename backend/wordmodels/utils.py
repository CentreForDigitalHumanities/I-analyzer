import os
from os.path import join
import pickle

from addcorpus.load_corpus import corpus_dir
from flask import current_app

def load_word_models(corpus, binned = False):

    if binned:
        path = current_app.config['WM_BINNED_FN']
    else:
        path = current_app.config['WM_COMPLETE_FN']

    try:
        wm_directory = join(corpus_dir(corpus), current_app.config['WM_PATH'])
    except KeyError:
        return "There are no word models for this corpus."
    with open(os.path.join(wm_directory, path), "rb") as f:
        wm = pickle.load(f)
    return wm

