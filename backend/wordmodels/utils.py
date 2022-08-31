import os
from os.path import join

from addcorpus.load_corpus import corpus_dir
from flask import current_app

def load_wm_documentation(corpus):
    try:
        wm_directory = join(corpus_dir(corpus), current_app.config['WM_PATH'])
    except KeyError:
        return None

    description_file = 'documentation.md'
    if description_file in os.listdir(wm_directory):
        with open(join(wm_directory, description_file)) as f:
            contents = f.read()
            return contents
    else:
        return None
