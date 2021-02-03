The Epigraphy section of the PEACE portal searches simultaneously through all the partner databases: IIP, Epidat, FIJI, and Medieval Toledo. 

It employs a system called Elasticsearch. To perform a search it is necessary to use terms and operators that Elasticsearch can understand. They are explained in detail below. 

## Searching for one term:
You may search for a string (a word or name) in the text transcription (meaning the actual epitaphs), or in other fields of the epigraphic database, for example in the Names field. You may also choose to perform a broad search, through all the fields of the Epigraphy section. For example, searching for the string `shalom` through all the fields will return results of `shalom al Israel` as well as the funerary inscription of a woman named `Shalom daughter of Jehohanan`. If you wish to limit your search to people named Shalom, you need to search for this term in the Names field.

## Searching for more than one term:
When you search for more than term, for example `peace on Israel`, the default search will combine all terms using `OR`. This means that the databases will be searched for either the word `peace`, or the word `on`, or the name `Israel`, or any combination thereof, and your search query will return results such as `On this day`. To avoid this and search for an entire phrase, use inverted commas around your search terms: `“peace on Israel”`.
If you wish to search for more than one term but in no particular order, use the + operator between your terms. For example: `wife +mother` will return all inscriptions that contain both these words.
Additional search operators are listed below.

| Operator | Description |
|:---:| --- |
| `+` | means AND  (`peace` AND `rest`)|
| &#124; | means OR (`peace` OR `rest`)|
| `-` | means NOT (NOT `rest`) |
| `"` | allows the search for an entire phrase “peace on his resting place” |
| `*` | is a wildcard for any number of characters. `rest*` will search for `rest, resting, restful`. The * operator is only allowed after other characters ( `rest*` is allowed, `*rest` is not) |
| `~N` | This operator represents fuzziness. When placed after a term this signifies how many characters are allowed to differ. So `rest~1` also searches for `rust, rent, pest`, etc. |
| `~N` | when placed after a phrase this signifies how many *words* may differ |

Symbols such as | and + are reserved characters. If you want to search for text containing these characters then they should be escaped by prefixing them with \.
Sometimes adding or removing spaces between your search terms and the operators may change the results of your search. 

For more information on the query syntax, consult the [Simple Query String manual of Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/7.9/query-dsl-simple-query-string-query.html).