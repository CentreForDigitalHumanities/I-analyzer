This graph shows a network of words that appear in the same contexts as the query term across the corpus.

This visualisation is based on word embeddings. View the [manual page on word embeddings](/manual/word-embeddings) for more information.

With this visualisation, you can explore the terms that have the highest similarity to the search term, and their relations to one another. Similarity scores are calculated as the [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity).

## Graph data

The graph shows the relations between the query term and its closests neighbours. These are the terms that have the highest similarity to the query term.

The neighbours of a word are not always similar to one another. For example, you might search for `bank` and find that `financial`, `river`, and `loan` are closely related. `financial` and `loan` are also highly similar to each other, but `river` is not similar to `financial`or `loan`.

The graph shows these connections. A link is drawn between terms that are similar to one another; they must be at least as similar as the target term and the lowest-ranking term in the graph. Links are drawn in a darker color if the similarity is higher.

## Controls

- The graph always shows data from a single timeframe at a time. You can use the "time frame" selection to choose the period.
- "link distance" controls how spread out terms in the graph are.
- "static" controls whether the force simulation in the graph (which tries to position nodes) is static or animated.
- You can click and drag on words in the graph to reposition them.
