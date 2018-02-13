The database used in I-analyzer is organised using Elasticsearch. To search it, it is necessary to use terms and operators which Elasticsearch can understand. A good reference to use can be the Simple Query String manual from Elasticsearch itself. It can be found here: https://www.elastic.co/guide/en/elasticsearch/reference/5.5/query-dsl-simple-query-string-query.html

Note that not everything mentioned in that manual is actually possible. Some options might have been switched off.

For your convenience, a summary of the main points from the manual follows below.

# Simple Query String Syntax

The search method supports the following operators:

| Operator | Description |
|:---:| --- |
| `+` | means AND (bank AND assets) |
| &#124; | means OR (bank OR assets) |
| `-` | means NOT (NOT assets) |
| `"` | allows the search for an entire phrase “the assets of the bank” |
| `*` | only allowed after other characters and is a wildcard for any number of characters (`asset*` is allowed, `*asset` is not) |
| `~N` | the fuzziness, when placed after a term this signifies how many characters are allowed to differ. So `bank~1` also searches for bang, sank, dank etc. |
| `~N` | when placed after a phrase this signifies how many *words* may differ |

Symbols such as `|` and `+` are reserved characters. If you want to search for text containing these characters then they should be escaped by prefixing them with `\`.

By default the search will combine all terms using `OR`. This means that when you type: `Tram Bike`, documents will be searched containing `Tram` and/or `Bike`. This also has implications for the `–`operator. `Tram Bike –Car` becomes documents containing `Tram`, `Bike` or any document not containing `Car`. A more expected result could be obtained by using `(Tram Bike) +-Car` which will return all hits containing `Tram` or `Bike` and withhold all those containing `Car`.

## Be Careful with Spaces
Adding or removing a space can change the results of your query. For example search for `+- term` is different than searching for `+-term`. It might be necessary to escape a space (also by placing a `\` in front of it).

### Examples of Search Results

Illustrating the differences when searching for different combinations of `bank` and `assets`.

| Query | Hits |
| --- | --- |
| `assets` | 568 hits |
| `bank` | 76161 hits |
| `bank  +assets` | 256 hits  (bank AND assets)|
| `+bank +assets` | 256 hits (AND bank AND assets)|
| `+bank +-assets` | 75905 hits (bank AND not assets, or: documents containing bank but not assets) |
| `+-bank +assets`| 312 hits (not bank but assets) |
| `"assets of the bank"` | 2 hits|
| `assets deposit` | 632 hits|
| `+assets +deposit`| 27 hits|
| `asset*`| 910 hits |
| `*asset` | There were no results to your query. |
| `bank~1` | 76241 hits (compare with just bank) | 
| `"the bank is"` | 24 hits |
| `"the bank is" ~1`| 32 hits |

By default all the fields are searched. If this is not the desired behavior specify a field name before the query e.g. `year:` or `content:`.

Generally it's clear what is causing the differences in search results. But in some other cases the cause can be harder to find. Hopefully some help can be found in this manual.

