This graph shows how the frequency of the search term is related to particular property of the documents, such as the date. 
The options for counting the frequency of the search term are explained below.

### Frequency of documents or terms

If you entered text in the search bar, you may choose whether to count documents or terms:

* For **documents**, the graph will display the number of documents that match the search term(s) and filters you have selected. It does not matter if your search term occurs multiple times in a document, or only once.
* For **terms**, the graph will display the number of matches for the search term(s). If the search term occurs multiple times in a document, each occurrence is counted. Counting search terms is slower than counting documents, so this option will take longer to load. 

If you did not search for text, the graph will always display the number of documents.

### Normalization

You can also choose a normalizer for the graph.

* Choosing **none** is the default. The graph will display the number of matches (either documents or terms, see above).
* If the graph is showing the number of documents, you can also view the amounts as a **percentage**. In this case, each bar shows the number of documents in that bin as a percentage of the total documents in the graph.
* If the graph is showing the number of terms, the amount of matches can be divided by the total number of **documents** in that category. For example, if you are looking at the number of matches by publication year, the number of matches for the search term will be divided by the total number of documents for that year. The total is counted as the number of documents in that year, ignoring the search text. Any filters you selected are still applied.
* If the data is present for the field(s) you are searching in, the number of matches for the search term can also be divided by total number of **terms** in that category. Using the same example, if you are looking at matches per year, this would be total number of words in that field for that year, ignoring search text but still using filters.

### Document limit

In you are visualising the term frequency, the graph may display a warning that there were too many documents to analyze. In that case, matches for the search term are only counted in the top *x* % of the results for each bin. (The warning will say how many.) These are the results with the highest relevance score, and therefore most likely to include the search term multiple times. For the rest of the documents in the results, it is assumed that they contain the search term only once. Therefore, the graph may be underestimating how often the search term occurred.