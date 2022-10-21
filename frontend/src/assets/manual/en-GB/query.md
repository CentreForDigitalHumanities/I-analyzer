You can use the search bar to search throug the document in a corpus. By de fault, you will be searching through all text fields, but you can also select specific fields to search through.

You can type in multiple query terms. For example, if you type in `tram bike`, you will search for documents that contain `tram` and/or `bike`.

It is also possible to formulate more advanced queries. We use the simple query string syntax of elasticsearch (our database system). This notation is explained in more details in the [Simple Query String manual of Elasticsearch itself](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/query-dsl-simple-query-string-query.html).

For your convenience, a summary of the search operators is shown below.

## Simple Query String Syntax

The search method supports the following operators:

| Operator | Description |
|:---:| --- |
| `+` | means AND (bank AND assets) |
| &#124; | means OR (bank OR assets). Note that OR is already the default way to combine search terms, so `bank assets` would be sufficient in this example. |
| `-` | means NOT (NOT assets) |
| `"` | allows the search for an entire phrase “the assets of the bank” |
| `*` | a wildcard for any number of characters, e.g. `bank*` will match _banking_, _banks_, _banked_, etc. The wildcard isnly allowed at the end of a word, and cannot be used with phrases (between `"` quotes). |
| `~N` | Describes fuzzy search. When placed after a term this signifies how many characters are allowed to differ. So `bank~1` also matches _bang_, _sank_, _dank_ etc. |
| `~N` | When placed after a phrase, this signifies how many *words* may differ |

Symbols such as `|` and `+` are reserved characters. If you want to search for text containing these characters then they should be escaped by prefixing them with `\`. For example, `bank + assets` matches documents with both _bank_ and _assets_, and `bank \+ assets` will search for either _bank_, the plus sign, or _assets_.

By default the search will combine all terms using `OR`. This means that when you type: `Tram Bike`, documents will be searched containing `Tram` and/or `Bike`. This also has implications for the `–`operator. `Tram Bike –Car` becomes documents containing `Tram`, `Bike` or any document not containing `Car`. A more expected result could be obtained by using `(Tram Bike) +-Car` which will return all hits containing `Tram` or `Bike` and withhold all those containing `Car`.

### Be Careful with Spaces
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

## Stemming

Some corpora support [stemming](https://en.wikipedia.org/wiki/Stemming) in the main content field. This means that when you search for `banking`, you will also find documents that contain _banks_, _bank_, etc. (However, a document that contains _banking_  will get a higher relevance score than one with _banks_.)

For corpora that support stemming, the list of search fields will include the stemmed text. For example, you can select both _Content_ and _Content (stemmed)_. If you do not want to search with stemming, you can select just the _Content_  field.
