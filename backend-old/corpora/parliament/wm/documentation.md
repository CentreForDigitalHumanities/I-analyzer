The word models for these parliamentary speeches were trained with Word2Vec, as implemented in the Python library [Gensim](https://radimrehurek.com/gensim/models/word2vec.html).

One model for all speeches from 1880-2020 was trained; this was used to retrain separate models for 20-year time windows, with a shift of 5 years.

The minimum count for a word to be included in the word model is 50, and the resulting word vectors have 128 dimensions.
