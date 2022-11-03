This graph shows the words which appear in the same contexts as the query term across the entire corpus.

## Word models

The similarity scores are based on [word embeddings](https://en.wikipedia.org/wiki/Word_embedding). The algorithm to compute these embeddings depends on the corpus, and is described in the corpus documentation (click 'models' at the top of the page).

For each corpus that includes word embeddings, we have trained a model of the complete corpus, and separate models for consecutive time frames. Thus, we can compute the overall similarity between terms, and say how this similarity develops over time.

If words appear in the same context, their vectors are more alike, which is reflected in a higher cosine similarity. Words that appear in the same context are likely to have related meanings: you can think of synonyms like `big` and `large`, but also antonyms like `black` and `white`, or simply words that are associated with the same topic, like `bank` and `financial`.

## The related words graph

The line graph includes the words with the highest similarity to your query term. This is the similarity across the entire corpus. The graph shows how these similarities develop over time, by showing the similarity per time frame. (This is based on the model from that timeframe, see above.)

Because words are selected based on their overall similarity, the line graph may not include the words that are most similar within a _specific_ timeframe.

You can select the `bar` view to view the most similar terms for each timeframe individually. In the bar view, the similar words are selected for that specific timeframe: they include the nearest neighbours in that time window, but not necessarily the nearest neighbours across the whole corpus.

### Selecting terms

If you want to select a few terms to compare, you can click terms in the legend to hide them in the graph. If you want a clean graph with just a few selected terms (without crossed-out terms in the legend), you can also use the 'compare similarity' tab of the word models page. In that graph, you can enter the specific terms you want to compare to your query term.
