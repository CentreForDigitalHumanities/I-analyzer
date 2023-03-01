The "neighbouring words" graph shows the most frequent [n-grams](https://en.wikipedia.org/wiki/N-gram) that include the search term. An n-gram is a sequence of words of a particular length, that occurs in the text. For example, you can search for _democracy_ and discover common two-word phrases (bigrams) that contain _democracy_, such as _parliamentary democracy_, or _democracy demands_.

The figure searches the corpus for the search term and counts the surrounding n-grams that the search term occurred in. It displays the most common n-grams, showing their frequency over time and compared to each other.

### Options

How the frequency of an n-gram is calculated depends on what options are chosen. The graph provides the following options:

- **Length of n-gram:** Search for _bigrams_ (two words), _trigrams_ (three words), or _fourgrams_ (four words).
- **Position of search term:** Specify the position that the search term should have within the n-gram. Choose "any" to include all positions, or choose a specific position. For instance, "first" will only include n-grams where the search term is the first word.
- **Compensate for frequency**: This option determines how n-grams are scored. When "no" is selected, the score equals the number of times the n-gram was observed. When "yes" is selected, this count is divided by the average frequency of the words in the n-gram across the entire corpus. Thus, n-grams that score high are common relative to the general frequency of the individual words. (For both options, n-grams are counted in a limited set of documents, see _document limit_ below.)
- **Language processing**: This option is not available for all corpora. If available, it selects what kind of processing should be done on the text before extracting n-grams. Options are:
    - _None:_ Use the original text, without any processing. (This is selected if the dropdown does not appear.)
    - _Remove stopwords:_ Remove stopwords (highly common words), as well as numbers.
    - _Stem and remove stopwords_: Remove stopwords and numbers (as above), and apply [stemming](https://en.wikipedia.org/wiki/Stemming) to all words.
- **Document limit:** By default, the graph is based on the top 100 documents for the search query per time interval. (The time intervals are shown on the horizontal axis.) You can select a smaller limit for faster results, or a greater limit to include more documents.
- **Number of n-grams:** The number of ngrams to display in the results.

### Visualisation

Each row of the graph shows the frequency of a single n-gram.

The line graph for each row shows how the frequency of that n-gram varies over time. You can hover over a point to see the frequency at that point in time. (Depending on whether you choice choice in "compensate for frequency", this either an absolute or relative number.)

By default, all the line graphs use the same scale. This can mean that for the lower (less frequent) n-grams, the development over time can be difficult to make out. You can select "fixed height for line graphs" at the bottom of the graph. If this is selected, each line graph is scaled separately to fit the row.

The bar chart on the right shows the total frequency of the n-gram. This is calculated as the sum of each of the frequencies per time period.
