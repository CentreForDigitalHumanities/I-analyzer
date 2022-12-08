# Adding word models

Corpora have the option to include word vectors. I-analyzer visualisations are built for _diachronic_ word models, showing how word meaning changes over time. As such, I-analyzer expects that you trained models for different time intervals.

## Format

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


If your are adding newly trained word models, you will also need to specify in the corpus definition that they may be included. Set the `word_models_path` property in the corpus to the directory in which the word models are stored.). See [troonredes.py](../backend/corpora/troonredes/troonredes.py) or [uk.py](../backend/corpora/parliament/uk.py) for examples.

