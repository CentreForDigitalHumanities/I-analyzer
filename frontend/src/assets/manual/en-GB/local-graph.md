This graph shows words that appear in the same contexts as the query term across the corpus.

## Word models

The similarity scores are based on [word embeddings](https://en.wikipedia.org/wiki/Word_embedding). The algorithm to compute these embeddings depends on the corpus, and is described in the corpus documentation (click 'models' at the top of the page).

For each corpus that includes word embeddings, we have trained a model of the complete corpus, and separate models for consecutive time frames. Thus, we can compute the overall similarity between terms, and say how this similarity develops over time.

If words appear in the same context, their vectors are more alike, which is reflected in a higher cosine similarity. Words that appear in the same context are likely to have related meanings: you can think of synonyms like `big` and `large`, but also antonyms like `black` and `white`, or simply words that are associated with the same topic, like `bank` and `financial`.

## Graph data

The graph shows the relations between the query term and its closests neighbours. These are the terms that have the highest similarity to the query term.

The neighbours of a word are not always similar to one another. For example, you might search for `bank` and find that `financial`, `river`, and `loan` are closely related. `financial` and `loan` are also highly similar to each other, but `river` is not similar to `financial`or `loan`.

The graph shows these connections. A link is drawn between terms that are similar to one another; they must be at least as similar as the target term and the lowest-ranking term in the graph. Links are drawn in a darker color if the similarity is higher.

## Controls

- The graph always shows data from a single timeframe at a time. You can use the "time frame" selection to choose the period.
- "link distance" controls how spread out terms in the graph are.
- "static" controls whether the force simulation in the graph (which tries to position nodes) is static or animated.
- You can click and drag on words in the graph to reposition them.
