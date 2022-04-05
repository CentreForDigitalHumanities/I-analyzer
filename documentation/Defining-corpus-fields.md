# Defining corpus fields

Each corpus has a number of fields, which are extracted from source data. Various classes (Metadata, XML, HTML, CSV) to extract field data are defined in `api/ianalyzer/extract.py`. The Metadata extractor can be used to gather information from file paths, and various extractors can also be combined.

Optionally, fields can also be associated with filters: data filters, multiplechoice filters (used for keyword data), and boolean filters. When setting a visualization type, this means the given field will be visualized on the frontend. Currently, choices are `timeline` (for date-like data), `term_frequency` (for keywords), and `wordcloud` (for text fields).
