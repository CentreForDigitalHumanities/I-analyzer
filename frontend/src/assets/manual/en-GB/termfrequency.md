This graph shows the frequency of the search term, compared by the value of a particular field. You can use the dropdown 'compare frequency by...' to select a field that you want to compare: depending on the metadata available for the corpus, this can be something like the date, the author, the genre, etc. This field will be shown on the x-axis, while the y-axis shows the number of results.

While it looks similar to the 'number of results' graph, this visualisation counts all occurrences of the search term. If your search term has three matches within a single document, these will count as three occurences.

## Normalisation

The graph can display absolute or relative frequencies, depending on the normalisation.

* Choosing **none** is the default. The graph will display the number of matches for the search term.
* The amount of matches can be divided by the total number of **documents** in that category. For example, if you are looking at the number of matches by publication year, the number of matches for the search term will be divided by the total number of documents for that year. The total is counted as the number of documents in that year, ignoring the search query. Any filters you selected are still applied.
* For some corpora, the number of matches for the search term can also be divided by total number of **terms** in that category. Using the same example, if you are looking at matches per year, this would be total number of words (in the fields you are searching in) for that year, ignoring search text but still using filters.

## Document limit

The graph may display a warning that there were too many documents to analyze. In that case, matches for the search term are only counted in the top *x* % of the results for each bin. (The warning will say how many.) These are the results with the highest relevance score, and therefore most likely to include the search term multiple times. For the rest of the documents in the results, it is assumed that they contain the search term only once. Therefore, the graph may be underestimating how often the search term occurred.

When this warning appears, you can also select the option to download the full data. You will be able to download the results as a csv table. This is essentially the same table you can see now, but all documents in your search results will be analysed to count the frequency of your search term.

## Zooming

You can zoom in on the x-axis by dragging the mouse. Double click on the graph to reset the zoom level.

## Multi-word queries

If you include several search terms, each will be counted. For example, if you search for `bike tram`, the sentence "You can travel by bike, tram, or car" will count as two matches.

If your search for an exact phrase, each occurence of the phrase is counted once. In the example sentence above, the query `"bike tram"` would have one occurence.

## Comparing queries

You can compare the results of multiple queries. For example, if you searched for `bike`, you can compare it with the results for `tram`. Use the button "compare with another query" to include more queries in your graph.

## Search fields

The term frequency graph only counts matches in the main content field of the corpus. This is always specified above the graph (e.g. "searching in Content"). For corpora that offer stemming, the term frequency graph will not search through the stemmed text.

If you made a query to search in all fields (including content, content with stemming, title, etc.), it is possible that the number of results is greater than the number of matches you see the term frequency graph.
