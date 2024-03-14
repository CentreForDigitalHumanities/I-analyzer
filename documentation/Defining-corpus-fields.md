# Defining corpus fields

Each corpus has a number of fields, which are extracted from source data. Each field is defined as a `Field` object, which defines how that field should be extracted from the source file, how it should be stored in elasticsearch, and how it should appear in the interface. See [corpus.py](../backend/addcorpus/corpus.py) for the class definition.

## Extracting values

Various classes are defined in `ianalyzer_readers.extract`

- The extractors `XML`, `HTML`, `CSV` and `JSON` are intended to extract values from the document type of your corpus. Naturally, `XML` is only available for `XMLCorpusDefinition`, et cetera. All other extractors are available for all corpora.
- The `Metadata` extractor is used to collect any information that you passed on during file discovery, such as information based on the file path.
- The `Constant` extractor can be used to define a constant value.
- The `Order` extractor gives you the index of that document within the file.
- The `Choice` and `Combined`, `Backup`, and `Pass` extractors can be used to combine multiple extractors.

A field can have the property `required = True`, which means the document will not be added to the index if the extracted value for this field is falsy.

## Elasticsearch mapping

Each field should specify its `es_mapping`, a dict that is passed on to elasticsearch to specify how it is indexed. See the [elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html). For common mappings, use the functions defined in [es_mappings.py](../backend/addcorpus/es_mappings.py)

The property `indexed` determines whether the field should be skipped during source extraction.

### Multifields

Elasticsearch supports specifying a `fields` parameter to a field to define subfields, allowing a hierarchical structure to fields. I-analyzer is designed for all fields to exist on the same level, so subfields will not be visible in the interface.

The one way in which multifields _are_ used is to allow different analyzers on the same text field. Text fields typically use the default analyzer, which performs basic tokenisation and converts text to lowercase. For more extensive analysis, subfields can be added. I-analyzer uses the following naming convention:

- `*.clean_{language_string}`: uses a language-specific analyzer to filter stopwords. It has a suffix indicating the language this analyzer is for, e.g., `*.clean_en` for English.
- `*.stemmed_{language_string}`: uses a language-specific analyzer to filter stopwords and stem words. It has a suffix indicating the language this analyzer is for, e.g., `*.stemmed_en` for English.
- `*.length`: specifies the token count of the text, which is useful for aggregations.
- `*.text`: a field with text mapping. Can be added to a keyword field to support full-text search in the field.

If you add fields with these names to the `es_mapping` of a text field, it enables some features in visualisations. If you add a multifield with these names that does not contain the expected type of data, some visualisations may not work. Do not do this.

All of these multifields can be created through the functions in `es_mappings.py`.

## Interface parameters

The following properties determine how a field appears in the interface.

`display_name` and `description` are optional and determine how a field is described in the interface. If you do not set `display_name`, the `name` property will be used instead.

`display_type`: set to `text_content` if this is the main text. It will appear as such in the results overview.

`results_overview` determines if a field should be included in the initial overview of a document in the results page. `hidden` determines if a field should be displayed when a user clicks on a result to see the complete document.

`search_filter` can be set if the interface should include a search filter widget for the field. I-analyzer includes date filters, multiplechoice filters (used for keyword data), range filters, and boolean filters. See [filters.py](../backend/addcorpus/filters.py).

`visualizations` optionally specifies a list of visualisations that apply for the field. Generally speaking, this is based on the type of data. For date fields and categorical/ordinal fields (usually keyword type), you can use `['resultscount', 'termfrequency']`. For text fields, you can use `['wordcloud', 'ngram']`. However, the ngram visualisation also requires that your corpus has a date field.

If a field includes the `'resultscount'` and/or `'termfrequency'` visualisations and it is not a date field, you can also specify `visualisation_sort`, which determines how to sort the x-axis of the graph. Default is `'value'`, where categories are sorted based on the y-axis value (i.e., frequency). You may specify that they should be sorted on `'key'`, so that categories are sorted alphabetically (for keywords) or small-to-large (for numbers).

`search_field_core` determines if a field is listed by default when selecting specific fields to search in. If it is not set to `True`, the user would have to click on "show all fields" to see it.

`csv_core` determines if a field is included in the CSV download of search results by default.

`sortable` determines whether a field should appear as a sort option.

### Language

For text and keyword fields, you can set the language of the field as follows:

`language` specifies the language of the fields contents. Acceptable values are:
- `None`; use this if the langauge is unknown or not applicable (e.g. for numbers or dates)
- an [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag); use this if the language is a constant
- `'dynamic'`; use this if the language is not always the same, and the IETF tag is stored in the `language_field` of the corpus.

This language metadata is used to set the `lang` property of the DOM element in the interface. Because I-analyzer is an application for text analysis, it may have other uses in the future.
