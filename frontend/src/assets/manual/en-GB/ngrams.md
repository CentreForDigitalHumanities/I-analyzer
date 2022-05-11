The "common n-grams" graph shows the most frequent [n-grams](https://en.wikipedia.org/wiki/N-gram) that include the search term. An n-gram is a sequence of words of a particular length, that is seen in the text. As such, the graph can be used to explore common phrases that the search term is used in.

The figures searches the corpus for the search term and counts the surrounding n-grams that the search term occurred in. It displays the 10 most common n-grams, showing their frequency over time and compared to each other.

### Options

How the frequency of an n-gram is calculated depends on what options are chosen. The graph provides the following options:

- **Length of n-gram:** Search for _bigrams_ (two words) or _trigrams_ (three words).
- **Position of search term:** Specify the position that the search term should have within the n-gram. Choose "any" to include all positions, or choose a specific position. For instance, "first" will only include n-grams where the search term is the first word.
- **Compensate for frequency**: This option determines how n-grams are scored. When "no" is selected, the score equals the number of times the n-gram was observed. When "yes" is selected, this count is divided by the average frequency of the words in the n-gram across the entire corpus. Thus, n-grams that score high are common relative to the general frequency of the individual words. For both options, n-grams are counted in a limited set of documents, see _document limit_ below.
- **Language processing**: This option is not available for all corpora. If available, it selects what kind of processing should be done on the text before extracting n-grams. Options are:
    - _None:_ Use the original text, without any processing. This is selected if there are no language processing options available for the corpus.
    - _Remove stopwords:_ Remove stopwords (highly common words), as well as numbers.
    - _Stem and remove stopwords_: Remove stopwords and numbers (as above), and apply [stemming](https://en.wikipedia.org/wiki/Stemming) to all words.
- **Document limit:** By default, the graph is based on the top 100 documents for the search query per time interval. (The time intervals are shown on the horizontal axis.) You can select a smaller limit for faster results, or a greater limit to include more documents.

### Visualisation

Each row of the graph shows the frequency of a single n-gram.

The line graph for each row shows how the frequency of that n-gram varies over time. The line graph is scaled to fit the row. You can hover over a point to see the frequency at that point in time.

The bar chart on the right shows the total frequency of the n-gram. This is calculated as the sum of each of the frequencies per time period.
