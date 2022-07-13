This graph shows the frequency of the search term, compared by the value of a particular field, such as the date. 

While it looks similar to the 'number of results' graph, this visualisation counts all occurrences of the search term. If your search term has three matches within a single document, these will count as three occurences.

## Normalization

The graph can display absolute or relative frequencies, depending on the normalisation.

* Choosing **none** is the default. The graph will display the number of matches for the search term.
* The amount of matches can be divided by the total number of **documents** in that category. For example, if you are looking at the number of matches by publication year, the number of matches for the search term will be divided by the total number of documents for that year. The total is counted as the number of documents in that year, ignoring the search query. Any filters you selected are still applied.
* For some corpora, the number of matches for the search term can also be divided by total number of **terms** in that category. Using the same example, if you are looking at matches per year, this would be total number of words (in the fields you are searching in) for that year, ignoring search text but still using filters.

## Document limit

The graph may display a warning that there were too many documents to analyze. In that case, matches for the search term are only counted in the top *x* % of the results for each bin. (The warning will say how many.) These are the results with the highest relevance score, and therefore most likely to include the search term multiple times. For the rest of the documents in the results, it is assumed that they contain the search term only once. Therefore, the graph may be underestimating how often the search term occurred.

## Zooming

You can zoom in on the x-axis by dragging the mouse. Double click on the graph to reset the zoom level.