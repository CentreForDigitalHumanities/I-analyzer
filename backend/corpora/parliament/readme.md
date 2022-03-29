This directory defines corpora for parliamentary speeches, made for the People & Parliament project. Each country has its own corpus, but the corpora should the same structure and formatting wherever possible. This readme is intended to record any conventions.

## Directory setup

The file [parliament.py](./parliament.py) defines a parent class `Parliament` which is a parent class for all other parliamentary corpora. It defines some class properties that should be shared. It also contains definitions for the fields `speech`, `date`, and `country`, which may be used for cross-corpus search.

Each country has a python file with the corpus definition (e.g. [netherlands.py](./netherlands.py)). In some cases, additional python files are used, typically to include source files from multiple time frames (e.g. [netherlands_recent.py](./netherlands_recent.py)).

The `utils` directory contains some common functionality between parliament classes:
- [constants.py](./utils/constants.py) defines constants (🙃), currently just the min_date and max_date.
- [field_defaults.py](./utils/field_defaults.py) contains the basic field definitions. For each field `foo` used in any of the parliament corpora, this file should contain a function `foo()` that returns a new instance of a `Field` object. This instance defines "default" properties of the field, which may be overwritten by parliament classes.
- [formatting.py](./utils/formatting.py) contains any functions useful for formatting values. The file is mostly intended for functions that are shared between several corpora. Corpus files often contain their own formatting functions as well, which usually serve to iron out idiosyncracies of the source files.
