The word models for the Dutch historical nuewspapers were trained with Word2Vec, as implemented in the Python library [Gensim](https://radimrehurek.com/gensim/models/word2vec.html).

Due to sparsity of data, for 1815-1840 one larger word model was trained; from 1826-1876, word models comprising 10 years, with a shift of 5 years, were trained.

Training parameters:
- training algorithm: CBOW
- window size: 5
- vector dimensionality: 100
- final vocabulary limit: 30'000