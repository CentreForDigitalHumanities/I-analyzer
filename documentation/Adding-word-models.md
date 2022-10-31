# Adding word models

Corpora have the option to include word vectors. I-analyzer visualisations are built for _diachronic_ word models, showing how word meaning changes over time. As such, I-analyzer expects that you trained models for different time intervals.

## Format

### SVD_PPMI
SVD_PPMI word models should be saved in two python pickle files. The names of these files are set in your configuration. The default config names them `complete.pkl` and `binned.pkl`; there is no reason to change this configuration. Note that the configuration is set for the entire app, not per corpus.

The file `complete.pkl` provides word vectors trained on the complete corpus. The unpickled object is a dictionary with the following keys:

- `'transformer'`: a scikit-learn [CountVectorizer](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html) object.
- `'svd_ppmi'`: a 2d numpy array with the word vectors. Each row represents a single word, where the order of words matches the transformer's vocabulary.

The file `binned.pkl` provides word vectors for each time frame. The unpickled object is a _list of dictionaries_, providing the models in chronological order. Each model contains a `transformer` object and `svd_ppmi` matrix, like the complete model. In addition, it has the keys `'start_year'` and `'end_year'`, which give the starting and ending year of the bin as integers.

### Word2Vec
Word2Vec models are expected to come with the following files:
- `_full.w2v` (contains gensim KeyedVectors for a model trained on the whole time period)
- `_full_analyzer.pkl` (a function to transform queries to terms)
- `_full_vocab.pkl` (contains a list of terms present in the word vectors of the whole time period)
For each time bin, it expects files of the format
- `_{startYear}_{endYear}.w2v` (contains gensim KeyedVectors for a model trained on the time bin)
- `_{startYear}_{endYear}_vocab.pkl` (contains a list of terms present in the word vectors of the time bin)

## Dcoumentation
Please include documentation on the method and settings used to train a model. This documentation is expected to be located in `wm/documentation.md`, next to the corpus definition that includes word models.

## Including word models

If your are adding newly trained word models, you will also need to specify in the corpus definition that they may be included. Set the `word_models_path` property in the corpus to the directory in which the word models are stored. Also set the `word_model_type` property to the type of training used for the model ('svd_ppmi' or 'word2vec'). See [troonredes.py](../backend/corpora/troonredes/troonredes.py) or [uk.py](../backend/corpora/parliament/uk.py) for examples.

