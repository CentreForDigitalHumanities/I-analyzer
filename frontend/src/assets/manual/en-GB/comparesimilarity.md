This graph allows you to compare the similarity of your query term to other terms you are interested in.

## Word models

The similarity scores are based on [word embeddings](https://en.wikipedia.org/wiki/Word_embedding). The algorithm to compute these embeddings depends on the corpus, and is described in the corpus documentation (click 'models' at the top of the page).

For each corpus that includes word embeddings, we have trained a model of the complete corpus, and separate models for consecutive time frames. Thus, we can compute the overall similarity between terms, and say how this similarity develops over time.

If words appear in the same context, their vectors are more alike, which is reflected in a higher cosine similarity. Words that appear in the same context are likely to have related meanings: you can think of synonyms like `big` and `large`, but also antonyms like `black` and `white`, or simply words that are associated with the same topic, like `bank` and `financial`.

## The similarity graph

You can enter one or more terms to compare your query term.

For each term, the graph will show the cosine similarity of that term compared to your query term. For example, if you searched for _netherlands_ and enter _belgium_ and _germany_ as your comparison terms, you will see the similarity scores of _netherlands_-_belgium_ and _netherlands_-_germany_.

The graph will show how the similarity develops over time, using the model from each timeframe (see above).

## Zooming

You can zoom in on the x-axis by dragging the mouse. Double click on the graph to reset the zoom level.
