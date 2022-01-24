This graph shows how the frequency of the search term is divided over a particular property of the documents, such as the date.

There are several options for counting the frequency of the search term. 

If you entered text in the search bar, you may choose whether to count **documents** or **terms**:

* For *documents*, the graph will display the number of documents that match the search term(s) and filters you have selected. It does not matter if your search term occurs multiple times in a document, or only once.
* For *terms*, the graph will display the number of matches for the search term(s). If the search term occurs multiple times in a document, each occurrence is counted. Counting search terms is slower than counting documents, so this option will take longer to load. It also becomes less accurate if the number of documents for a bin exceeds 100.

If you did not search for text, the graph will always display the number of documents.


You can also choose a **normalizer** for the graph.

* Choosing *none* is the default. The graph will display the number of matches (either documents or terms, see above).
* If the graph is showing the number of documents, you can also view the amounts as a *percentage*. In this case, each bar shows the number of documents in that bin as a percentage of the total documents that match the query.
* If the graph is showing the number of terms, the amount of matches can be divided by the total number of *documents* in that category. For example, if you are looking at the number of matches by year, the number of matches for the search term will be divided by the total number of documents for that year. The total is counted as the number of documents in that year, ignoring the search text. Filters are still applied.
* If the data is present for the corpus, the number of matches for the search term can also be divided by total number of *terms* in that category. Using the same example, if you are looking at matches per year, this would be total number of words for that year, ignoring search text but still using filters.