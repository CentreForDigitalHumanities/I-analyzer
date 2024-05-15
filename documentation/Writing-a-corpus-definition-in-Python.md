# Writing a corpus definition in Python

This document is a guide to writing a Python corpus definition.

The steps of adding a new Python corpus are usually the following:

- Create a new python class in the I-analyzer repository, which will describe the corpus
- Include the corpus in your local django settings and include (local) source data
- Load the corpus into your local database
- Create and populate a local elasticsearch index for the corpus
- Workshop the corpus definition, add unit tests
- Make a pull request
- Create and populate a production elasticsearch index on the production cluster using your test branch. (We use a dedicated I-analyzer instance for indexing.)
- Include the corpus definition in the next release and deploy it in production.
- Verify everything works as expected and adjust the corpus permissions in the production admin interface, so users can see it.

## Corpus definition

Start by adding a new Python module `corpusname.py` to the `backend/corpora` directory, and include in the `CORPORA` setting of your Django settings. (Use `settings_local.py` to set this for your own development server only.)

The actual definition is a class that you define in this module. It should subclass the [`CorpusDefinition` class](/backend/addcorpus/python_corpora/corpus.py).  This class includes some default values for attributes and default behaviour.

It also inherits the `Reader` class from [`ianalyzer_readers`](https://ianalyzer-readers.readthedocs.io/en/latest/) which provides very minimal functionality for reading source files. Most corpus definitions also inherit from a more specific `Reader` that provides functionality for the type of source data, e.g. `XMLReader`, `CSVReader`, etc. For convenience, you can use the classes `XMLCorpusDefinition`, `CSVCorpusDefinition`, etc., defined in [corpus.py](/backend/addcorpus/python_corpora/corpus.py). See [the documentation of ianalyzer_readers](https://ianalyzer-readers.readthedocs.io/en/latest/) for the available `Reader` classes and the API for each of them.

Your definition module should now look something like this:

```python
from addcorpus.corpus import CSVCorpusDefinition

class MyCorpus(CSVCorpusDefinition):
    pass
```

This class will describe all metadata for the corpus, but various attributes and methods need to be filled in before the corpus is ready for use.

Many of these values will be hard-coded in the definition class, but some will need to be imported from the project settings, because they need to be configurable. (For example, the location of source data.) More on the use of settings below.

## Attributes and methods

### Required attributes

The following attributes are required for a corpus to function.

| Attribute | Type | Description |
|-----------|------|-------------|
| `title`   | `str` | Title to be used in the interface. |
| `description` | `str` | Short description; appears as a subtitle in the interface. |
| `min_date` | `datetime.date` | The minimum date for the data in the corpus. This is shown as metadata in the corpus overview. It is not used to restrict the data. |
| `max_date` | `datetime.date` | The maximum date for the data - analogous to `min_date`. |
| `category` | `str` | The type of data in the corpus. See the [options for categories](/backend/addcorpus/constants.py). |
| `languages` | `List[str]` | A list of IETF tags of the languages used in your corpus. Corpus languages are intended as a way for users to select interesting datasets, so only include languages for which your corpus contains a meaningful amount of data. The list should go from most to least frequent. You can also include `''` for "unknown". |
| `es_index` | `str` | The name of the elasticsearch index. In development, the corpus name will do. On a production cluster, you may need to use a particular prefix. |
| `data_directory` | `Optional[str]` | Path to the directory containing source files. Always get this from the setttings. You can also set this to `None`; usually because you are getting source data from an API instead of a local directory. |
| `fields` | `List[Field]` | The fields for the corpus. See [defining corpus fields](./Defining-corpus-fields.md). |

### Required methods

The corpus class must define a method `sources(self, **kwargs)`. See the [API documentation of ianalyzer_readers](https://ianalyzer-readers.readthedocs.io/en/stable/api/). When you run the indexing command, I-analyzer can provide two named arguments, `start` and `end`, which give a minimum and maximum date to select source files.

### Optional attributes

| Attribute | Type | Description |
| `image` | `str` | The filename of the image used for the corpus in the interface. (See below.) |
| `es_alias` | `str` | An alias that you want to assign to the index in elasticsearch. |
| `es_settings` | `Dict` | Customises the settings of the elasticsearch index. Can be generated using [es_settings.py](../backend/addcorpus/es_settings.py) |
| `scan_image_type` | `str` | The MIME type of media attachments to documents, if these are included. |
| `allow_image_download` | `bool` | If the corpus has media attachments, this controls if they can be downloaded from the interface. |
| `document_context` | `Dict` | Defines how to group documents into a "context". For example, if each document is a page, you can configure this setting so users can view a book. See the docstring of this attribute for details. |
| `default_sort` | `Dict` | Defines the default method to sort search results if the user has not entered a query. See the docstring of this attribute for details. |
| `language_field` | `str` | If the corpus contains documents in multiple languages, this can specify the name of the field that stores the IETF tag for each document. |
| `description_page` | `str` | Name of the file with a general description of the corpus. See below. |
| `citation_page` |  `str` | Name of the file with citation guidelines. See below. |
| `wordmodels_page` | `str` | Name of the file documenting word models. See below. |
| `license_page` | `str` | Name of the file containing a licence for the data. See below. |
| `terms_of_service_page` | `str` | Name of the file containing terms of service. See below. |

### Documentation files and corpus image

If you include a corpus image or documentation pages, these need to be included as separate files.

Each file should be located in a specific subdirectory of the directory that contains your definition module. Specifically:

| Filename attribute | Subdirectory |
|--------------------|--------------|
| `image`            | `images`     |
| `description_page` | `description` |
| `citation_page`    | `citation`   |
| `wordmodels_page`  | `wm`         |
| `license_page`     | `license`    |
| `terms_of_service_page` | `terms_of_service` |

This means that if your corpus includes `image = 'mycorpus.jpg'`, your directory should be structured like this:

```
mycorpus/
├ mycorpus.py
└ images/
  └ mycorpus.jpg
```

The image can be any image file. Documentation pages must be markdown files. See [corpus documentation](/documentation/Corpus-documentation.md) for more information about writing documentation.

## Using project settings

Several of the attributes in a corpus definition need to be configurable per environment. This is done by including these values in the project settings.

Please use the following naming convention when you add settings for your corpus.

```python
CORPUSNAME_DATA = '/MyData/CorpusData' # the directory where the xml / html or other files are located
CORPUSNAME_ES_INDEX = 'dutchbanking' # the name that elasticsearch gives to the index
CORPUSNAME_SCAN_IMAGE_TYPE = 'image/png' #mimetype of document media
# etc...
```

These can be retrieved in the corpus definition, for example:

```python
from django.conf import settings

class Times(XMLCorpus):
    title = "Times"
    description = "Newspaper archive, 1785-2010"
    min_date = datetime(year=1785, month=1, day=1)
    max_date = datetime(year=2010, month=12, day=31)
    data_directory = settings.TIMES_DATA
    es_index = getattr(settings, 'TIMES_ES_INDEX', 'times')
    # ...
```

Note that for a property like the elasticsearch index, we define a default value but make it possible to override this in the settings file, while the data directory is required.

## Unit testing

It is strongly recommended that you include unit tests for your corpus. A minimal test is to try to load your corpus into the database and check that it does not run into validation errors. In addition, it is recommended that you include some tests that check the output of the data extraction.

The rechtspraak corpus includes good examples of such tests.
