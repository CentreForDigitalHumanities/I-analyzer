# How to add a new corpus to I-analzyer

## Corpus definition
Adding a new corpus starts by adding a new corpus description `corpusname.py` to the `api/ianalyzer/corpora` directory. The corpus description imports global variables from `api/ianalyzer/config.py`. The definition file should be registered in `backend/ianalyzer/config.py` under `CORPORA`. More on the use of config below.

The corpus definition is a python class definition, sublcassing `Corpus` class, found in `addcorpus/common.py`. This class contains all information particular to a corpus that needs to be known for indexing, searching, and presenting a search form.

The corpus class should define the following properties:

- `title`: Title to be used in the interface.
- `description`: Short description, appears as a subtitle in the interface.
- `data_directory`: Path to the source files. Always this from configuration. 
- `min_date`, `max_date`: The minimum and maximum dates for documents.
- `es_index`: the name of the index in elasticsearch.
- `image`: a path or url to the image used for the corpus in the interface.
- `fields`: a list of `Field` objects. See [defining corpus fields](./Defining-corpus-fields.md).

The following properties are optional:
- `es_alias`: an alias for the index in elasticsearch.
- `es_settings`: overwrites the `settings` property of the elasticsearch index.
- `scan_image_type`: the filetype of scanned documents, if these are included.
- `allow_image_download`
- `desription_page`: URL to markdown document with a comprehensive description

The corpus class should also define a function `sources(self, start, end)` which iterates source flies (presumably within on `data_directory`). The `start` and `end` properties define a date range: if possible, only yield files within the range. Each source file should be tuple of a filename and a dict with metadata.

### XML / HTML corpora

If your source files are XML or HTML files, your corpus definition should respectively subclass `XMLCorpus` or `HTMLCorpus`.

In addition to the properties above, the corpus class must define:
- `toplevel_tag`: The highest-level tag in the source file.
- `toplevel_entry`: The tag that corresponds to a single document entry.

### CSV corpora
If your source files are CSV files, your corpus definition should subclass `CSVCorpus`.

The CSV files will be read row by row, 

In addition to the properties above, CSV corpora have the following optional properties:
- `field_entry`: specifies a field in de CSV that corresponds to a single document entry. A new document is begins whenever the value in this field changes. If left undefined, each row of the CSV will be indexed as a separate document.
- `required_field`: rows with this field empty will be skipped.

## Config file
The config files can be used to define global variables that may be depend on the environment. Please use the following naming convention.

```python
CORPUSNAME_ES_INDEX = 'dutchbanking' # the name that elasticsearch gives to the index
CORPUSNAME_ES_DOCTYPE = 'page' # typically corresponds to `tag_toplevel` in the corpus definition
CORPUSNAME_DATA = '/MyData/CorpusData' # the directory where the xml / html or other files are located
CORPUSNAME_MIN_DATE = datetime(year=1957, month=1, day=1) # default start date of indexing
CORPUSNAME_MAX_DATE = datetime(year=2008, month=12, day=31) # default end date of indexing
CORPUSNAME_TITLE = 'MyTitle' # title as displayed in frontend corpus selection menu
CORPUSNAME_DESCRIPTION = 'MyDescription' # description as displayed in corpus selection menu
CORPUSNAME_IMAGE = '/Location/Of/Image.jpg' # location of image as displayed in corpus selection menu
CORPUSNAME_ES_SETTING = ... # any corpus-specific settings, such as custom analyzers
```

You do not need to define all of these variables in the config: they may also be defined statically in the corpus definition, if there is no reason to configure them depending on the environment.

These can be retrieved in the corpus definition, for example:

```python
class Times(XMLCorpus):
    title = "Times"
    description = "Newspaper archive, 1785-2010"
    min_date = datetime(year=1785, month=1, day=1)
    max_date = datetime(year=2010, month=12, day=31)
    data_directory = current_app.config['TIMES_DATA']
    es_index = current_app.config['TIMES_ES_INDEX']
    ...
```

_**WHAT IS CORPUS SELECTION IN THE COMMANDS ABOVE?**_(AHJ)

The dictionary `CORPORA` defines the name of the corpora and their filepath. `CORPUS_SERVER_NAMES` defines to which server (defined in `SERVERS`) the backend should make requests.

The `CORPORA` dict is defined as

```python
CORPORA = {
    'times': '.../times.py',
}
```

The key of the corpus must match the name of the corpus class (but lowercase/hyphenated), so `'times'` is the key for the `Times` class. Typically, the key also matches the `es_index` of the corpus, as well as its filename.  

### default_config vs. config
`config_fallback.py` regulates that all information in `config.py` overrules information in `default_config.py`. All sensitive information (server names, user names, passwords) should be in `config.py`, as this will 1) never be committed to github, and 2) be located in the `private` folder upon deployment. 

## Elasticsearch
Once the corpus definition and associated global variables are added, the only remaining step is to make the Elasticsearch index. By running `flask es -c corpusname`, information is extracted and sent to Elasticsearch. 
Optional flags:
- `-s 1990-01-01` sets different start date for indexing
- `-e 2000-12-31` sets different end data for indexing
- `-d` specifies that an existing index of `CORPUSNAME_ES_INDEX` should be deleted first (if not specified, defaults to `False`, meaning that extra data can be added while existing data is not overwritten)

The start and end date flags are passed on the `sources` function of the corpus (see above). If you did not utilise them there, they will not do anything.
