# Adding word models

Corpora have the option to include word vectors. I-analyzer visualisations are built for _diachronic_ word models, showing how word meaning changes over time. As such, I-analyzer expects that you trained models for different time intervals.

## Format

Word models should be saved in two python pickle files. The names of these files are set in your configuration. The default config names them `complete.pkl` and `binned.pkl`; there is no reason to change this configuration. Note that the configuration is set for the entire app, not per corpus.

The file `complete.pkl` provides word vectors trained on the complete corpus. The unpickled object is a dictionary with the following keys:

- `'transformer'`: a scikit-learn [CountVectorizer](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html) object.
- `'svd_ppmi'`: a 2d numpy array with the word vectors. Each row represents a single word, where the order of words matches the transformer's vocabulary.

The file `binned.pkl` provides word vectors for each time frame. The unpickled object is a _list of dictionaries_, providing the models in chronological order. Each model contains a `transformer` object and `svd_ppmi` matrix, like the complete model. In addition, it has the keys `'start_year'` and `'end_year'`, which give the starting and ending year of the bin as integers.

## Including word models

The two word model files must be stored in the same location as your corpus definition. That is to say, the directory that contains your definition `my-corpus.py` should have a subdirectory `wm` that contains the two pickle files. (The name `wm` is set in the default configuration and can be changed in your own config, though you probably won't have a reason to do this.) Note that the `wm` folder is ignored by git.

If your are adding newly trained word models, you will also need to specify in the corpus definition that they may be included. Set the `word_models_present` property in the corpus to look in the subdirectory. See [troonredes.py](../backend/corpora/troonredes/troonredes.py) or [dutchannualreports.py](../backend/corpora/dutchannualreports/dutchannualreports.py) for examples.

