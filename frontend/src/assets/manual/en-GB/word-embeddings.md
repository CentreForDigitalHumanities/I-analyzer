[Word embeddings](https://en.wikipedia.org/wiki/Word_embedding) are an abstract way of representing words as a sequence of numbers. You can think of this like drawing a map and giving each word in a corpus a set of coordinates, so that similar words are placed close to one another, and very dissimilar words are spaced far apart.

## What is similarity?

To see which words a similar, a machine learning model scans a corpus: words are similar if they are used in similar contexts. For example, `cow` and `calf` may be similar because they are both used around the same words like `barn`, `grass`, and `milk`, whereas `cow` and `cat` are less similar, because the contexts in which cows and cats are mentioned, have less overlap.

Words that are very similar (that is, words that occur in the same contexts) often have related meanings. You can think of synonyms (like `big` and `large`), but also antonyms (like `black` and `white`). It can also include other relations (like `cow` and `calf`), or simply words that are associated with the same topic (like `bank` and `financial`).

## How are word embeddings created?

The vector coordinates of each word (and thus how similar words are to each other) are determined by a machine learning model, based on the text of a corpus. Together, they form a model of the words in the corpus, and how those words are used in the text.

At its core, this model counts which words tend to occur together in the corpus. (For example, you can count pairs of words that occur at most 4 words apart.) It then creates a "map" that tries to capture similarities between words.

A typical map is two-dimensional, so the coordinates for each point are two numbers. With word embeddings, word are represented by much longer sequences of numbers, for example 200. This allows them to capture much more complex information than if you tried to arrange all words on a 2D map.

There are different algorithms to train word embeddings. What algorithm works, and how exactly this should be configured, can depend on the corpus. If a corpus on I-analyzer has word embeddings available, the information page will describe what algorithm is used.

## How can you use word embeddings?

While word embeddings are very abstract representations, they can be a very useful tool in qualitative research. You can evaluate and expand your search terms by exploring related terms in this computational model.

### Finding related search terms

When you start your research, you often have a few keywords that you are interested in. For example, say that you want to search for `democracy`. A possible pitfall is that author or speaker may talk about issues of democracy and representation, but not use this specific word.

To help you out, you can use the word embeddings of a corpus to find terms related to your initial search term, `democracy`. When you explore the most similar words, you may find other terms such as `democratic` or `parliament`. Perhaps you also find words that you would not have thought of, such as `liberalism`, which was very closely associated with the concept of democracy in the 19th century, but less so today.

You may also find terms that are not synonymous with democracy, but are closely related because they are often contrasted with democracy, such as `dictatorship`. So if you are researching how Dutch authors discuss democracy, it can make sense to extend your search to terms like "dictatorship".

So by looking at the related words, you can identify other search terms that may be interesting for your research.

### Discovering other senses of a word

When you have selected a search term for your research, it is possible that this term also has other meanings that you did not think of. For example, there might be a historic use of the term that you were not aware of.

By exploring the most similar words, you can identify words that are related to other uses of your search term. For example, when we search for `democracy`, we may find terms that are very closely related to "social democracy". In this case, the term democracy is used to denote a political movement; it does not directly refer to the political system.

### Showing changes over time

Word embeddings on I-analyzer are always *diachronic*: rather than creating a single model of the whole corpus, we train separate models for different time intervals. So when we look at the similarity scores between words, we can compare how that similarity changes over time.

Changes in similarity can reflect changes in how words are used over time. Words can be used in new contexts and take on new meanings. Because such changes tend to cover long time periods, it can be difficult to reliably detect such changes if you are only relying on qualitative analysis. After all, you can only read a limited amount of text.

Therefore, it can be useful to note trends that are captured in the model and compare them with your own observations. For example, as mentioned above, your corpus may show that the the terms `democracy` and `liberalism` show a very high similarity in the 19th century and a lower similarity in the late 20th century.

This may be an interesting observation in itself, if you are investigating how concepts like democracy and liberalism evolve over time. It can verify what you observed in reading documents from these periods, or it can be a jumping-off point for closer inspection.

Observing these changes can also help you to avoid blind spots in your research. When dealing with historic texts, it is important to be aware of how the meaning of a word can change over time. When you search for a term that takes on a completely different meaning, you will get very different results from different time periods.


