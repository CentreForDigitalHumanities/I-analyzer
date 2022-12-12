Like the [related words graph](/manual/relatedwords), the word context graph shows words that appear in similar contexts to the query term. Instead of showing the similarity with the query term, the graph shows the neighbouring words as a two-dimensional scatter plot, showing how close the terms are to each other.

This visualisation can help to visualise the relationships between terms. However, while the related words and word similarity graphs show the actual cosine similarities in the model, the distances between words in the scatter plot are an _approximation_ of the distances in the real model. They may not be accurate.

## Analysis

For each time interval, the graph selects the nearest neighbours to the query term(s). It then uses [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis) to map the selected terms onto a two-dimensional plot. After this, the 2D map for each timeframe is rotated so it best aligns with the previous timeframe. The optimal angle is determined using [Nelder-Mead optimisation](https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method).
