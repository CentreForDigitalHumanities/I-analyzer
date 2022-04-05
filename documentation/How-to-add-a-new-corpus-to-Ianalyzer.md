# How to add a new corpus to I-analzyer

## Corpus definition
Adding a new corpus starts by adding a new corpus description `corpusname.py` to the `api/ianalyzer/corpora` directory. The corpus description imports global variables from `api/ianalyzer/config.py` and defines the `toplevel_tag` and `toplevel_entry` variables for which to scan in `.xml` or `.html` files.

Each corpus has a number of fields, which are extracted from source data. Various classes (Metadata, XML, HTML) to extract field data are defined in `api/ianalyzer/extract.py`. The Metadata extractor can be used to gather information from file paths, and various extractors can also be combined.

Optionally, fields can also be associated with filters: data filters, multiplechoice filters (used for keyword data), and boolean filters. When setting a visualization type, this means the given field will be visualized on the frontend. Currently, choices are `timeline` (for date-like data), `term_frequency` (for keywords), and `wordcloud` (for text fields).

## Config file
The config file defines global variables:
```python
CORPUSNAME_ES_INDEX = 'dutchbanking' # the name that elasticsearch gives to the index
CORPUSNAME_ES_DOCTYPE = 'page' # typically corresponds to `tag_toplevel` in the corpus definition
CORPUSNAME_DATA = '/MyData/CorpusData' # the directory where the xml / html or other files are located
CORPUSNAME_MIN_DATE = datetime(year=1957, month=1, day=1) # default start date of indexing
CORPUSNAME_MAX_DATE = datetime(year=2008, month=12, day=31) # default end date of indexing
CORPUSNAME_TITLE = 'MyTitle' # title as displayed in frontend corpus selection menu
CORPUSNAME_DESCRIPTION = 'MyDescription' # description as displayed in corpus selection menu
CORPUSNAME_IMAGE = '/Location/Of/Image.jpg' # location of image as displayed in corpus selection menu
```

_**WHAT IS CORPUS SELCECTION IN THE COMMANDS ABOVE?**_(AHJ)

The dictionary `CORPORA` defines the name of the corpora (typically identical to `ES_INDEX` of the given corpus) and their filepath. `CORPUS_SERVER_NAMES` defines to which server (defined in `SERVERS`) the backend should make requests.

### default_config vs. config
`config_fallback.py` regulates that all information in `config.py` overrules information in `default_config.py`. All sensitive information (server names, user names, passwords) should be in `config.py`, as this will 1) never be committed to github, and 2) be located in the `private` folder upon deployment. 

## Elasticsearch
Once the corpus definition and associated global variables are added, the only remaining step is to make the Elasticsearch index. By running `flask es -c corpusname`, information is extracted and sent to Elasticsearch. 
Optional flags:
- `-s 1990-01-01` sets different start date for indexing
- `-e 2000-12-31` sets different end data for indexing
- `-d` specifies that an existing index of `CORPUSNAME_ES_INDEX` should be deleted first (if not specified, defaults to `False`, meaning that extra data can be added while existing data is not overwritten)