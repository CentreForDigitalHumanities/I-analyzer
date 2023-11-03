The word models for these parliamentary speeches were trained with Word2Vec, as implemented in the Python library [Gensim](https://radimrehurek.com/gensim/models/word2vec.html).

In the 20th century, models for 20-year time windows, with a shift of 10 years, were trained. For earlier periods, due to limited availability of training data, the data spans larger time slices.

Training parameters:
- training algorithm: CBOW
- window size: 5
- minimum word count for inclusion in model: 80
- vector dimensionality: 100
- vocabulary limit: None