# Defining corpus fields

Each corpus has a number of fields, which are extracted from source data. Each field is defined as a `Field` object, which defines how that field should be extracted from the source file, how it should be stored in elasticsearch, and how it should appear in the interface. See [corpus.py](../backend/addcorpus/corpus.py) for the class definition.

## Extracting values

Various classes `api/ianalyzer/extract.py`.

- The extractors `XML`, `HTML` and `CSV` are intended to extract values from the document type of your corpus. Naturally, `XML` is only available for `XMLCorpus`, et cetera. All other extractors are available for all corpora.
- The `Metadata` extractor is used to gather information from file paths.
- The `Constant` extractor can be used to define a constant value.
- The `Choice` and `Combined` extractors can be used to combine multiple extractors.

## Elasticsearch mapping

Each field should specify its `es_mapping`, a dict that is passed on to elasticsearch to specify how it is indexed. See the [elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html).

### Multifields

Elasticsearch supports specifying a `fields` parameter to a field to define subfields, allowing a hierarchical structure to fields. I-analyzer is designed for all fields to exist on the same level, so subfields will not be visible in the interface.

The one way in which multifields _are_ used is to allow different analyzers on the same text field. Text fields typically use the default analyzer, which performs basic tokenisation and converts text to lowercase. For more extensive analysis, subfields can be added. I-analyzer uses the following naming convention:

- `*.clean`: uses a language-specific analyzer to filter stopwords.
- `*.stemmed`: uses a language-specific analyzer to filter stopwords and stem words.
- `*.length`: specifies the token count of the text, which is useful for aggregations.

If you add fields with these names to the `es_mapping` of a text field, it enables some features in visualisations. If you add a multifield with these names that does not contain the expected type of data, some visualisations may not work. Do not do this.

The property `indexed` determines whether the field should be included in the elasticsearch index. If set to `False`, the field can be displayed in the results, but it is not searchable.

## Interface parameters

The following properties determine how a field appears in the interface.

`display_name` and `description` are optional and determine how a field is described in the interface. If you do not set `display_name`, the `name` property will be used instead.

`display_type`: set to `text_content` if this is the main text. It will appear as such in the results overview.

`results_overview` determines if a field should be included in the initial overview of a document in the results page. `hidden` determines if a field should be displayed when a user clicks on a result to see the complete document.

`search_filter` can be set if the interface should include a search filter widget for the field. I-analyzer includes date filters, multiplechoice filters (used for keyword data), range filters, and boolean filters. See [filters.py](../backend/addcorpus/filters.py).

`visualizations` optionally specifies a list of visualisations that apply for the field. Generally speaking, this is based on the type of data. For date fields and categorical/ordinal fields (usually keyword type), you can use `['resultcount', 'termfrequency']`. For text fields, you can use `['wordcloud', 'ngram']`. If the corpus has word embeddings and they are trained on a field, add `'relatedwords'` to that field's visualisations.

If a field includes the `'resultcount' and/or `'termfrequency'` visualisations and it is not a date field, you can also specify `visualisation_sort`, which determines how to sort the x-axis of the graph. Default is `'value'`, where categories are sorted based on the y-axis value (i.e., frequency). You may specify that they should be sorted on `'key'`, so that categories are sorted alphabetically (for keywords) or small-to-large (for numbers).

`search_field_core` determines if a field is listed by default when selecting specific fields to search in. If it is not set to `True`, the user would have to click on "show all fields" to see it.

`csv_core` determines if a field is included in the CSV download of search results by default.

`sortable` determines whether a field should appear as a sort option. Optionally, you can specify a sortable field that should be used as the default sorting if there is no query (with a query, results are sorted by relevance by default). Set `primary_sort = True` for that field. (Setting primary_sort for more than one field will only affect the first in the list.)
