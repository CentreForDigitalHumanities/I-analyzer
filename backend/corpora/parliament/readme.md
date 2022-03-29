This directory defines corpora for parliamentary speeches, made for the People & Parliament project. Each country has its own corpus, but the corpora should the same structure and formatting wherever possible. This readme is intended to record any conventions.

## Directory setup

The file [parliament.py](./parliament.py) defines a parent class `Parliament` which is a parent class for all other parliamentary corpora. It defines some class properties that should be shared. It also contains definitions for the fields `speech`, `date`, and `country`, which may be used for cross-corpus search.

Each country has a python file with the corpus definition (e.g. [netherlands.py](./netherlands.py)). In some cases, additional python files are used, typically to include source files from multiple time frames (e.g. [netherlands_recent.py](./netherlands_recent.py)).

The `utils` directory contains some common functionality between parliament classes:
- [constants.py](./utils/constants.py) defines constants (🙃), currently just the min_date and max_date.
- [field_defaults.py](./utils/field_defaults.py) contains the basic field definitions. For each field `foo` used in any of the parliament corpora, this file should contain a function `foo()` that returns a new instance of a `Field` object. This instance defines "default" properties of the field, which may be overwritten by parliament classes.
- [formatting.py](./utils/formatting.py) contains any functions useful for formatting values. The file is mostly intended for functions that are shared between several corpora. Corpus files often contain their own formatting functions as well, which usually serve to iron out idiosyncracies of the source files.

The `tests` directory defines tests for corpus definitions. Each country should have a test that checks the output of `documents()` for an example source file. Setup for tests is defined in [conftest.py](./conftest.py).

The `images` directory contains the images used in the corpus overview.

## Adding a corpus

- Make a corpus class. It should be a child class of `Parliament` and the corpus class for your type of source file, i.e. `CSVCorpus`, `XMLCorpus`, etc.
- Define metadata like title, description, etc. Follow the examples of other corpora in where and how to include data from `config`.
- Add an (open license) image of the parliament in `./images/`.
- Define `es_settings` property. Import `PP_ES_SETTINGS` from config, and add language-specific analyzers. Include an analyzer `stopwords` and `stemmer`.
- Check which of the fields in `field_defaults.py` contain information that is present in your source files. For each, make a new instance using the default function. Define the extractor. If needed, you can overwrite other properties. Do not overwrite `name` or `display_name`.
- If your source files contain relevant information that is not an existing field, add it in `field_defaults.py`, leaving out the extractor. Then define it in your class as desired.
- Define the `fields` property in `__init__(self)`.

## Fields

A shared list of field definitions is provided in [field_defaults.py](./utils/field_defaults.py)

### Country

Country of the corpus in English.

### Date

Date of the speech in `yyyy-MM-dd` format. If your corpus uses a different `min_date` and `max-date`, you should also set these for the date filter here.

### House

House of parliament where the debate took place. Use the source language ("Eerste Kamer" rather than "senate") and title case.

### Debate title

Title of the debate in the source language. Use title case. Remove leading or trailing punctuation.

### Debate ID, speech ID, speaker ID, party ID

Various unique IDs. The uniqueless is on the level of the country corpus.

### 