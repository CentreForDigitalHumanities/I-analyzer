timestextminer
===============================================================================


`timestextminer` is a Python package that provides the following:

- A front-end that enables users to search through an ElasticSearch 5 index of a text corpus, and stream search results into a CSV file. For now, `flask` is used for serving the interface and generating results. On the client side, the interface uses JQuery-UI.

- Underneath, the package provides a way to link together the source data files of a corpus, corresponding entries in an ElasticSearch index, and the forms that enable users to query that index. XML data is parsed with `beautifulsoup4` + `lxml` and passed through to the index using the `elasticsearch` package for Python (not `elasticsearch-dsl`, since its [documentation](https://elasticsearch-dsl.readthedocs.io/en/latest) at the time seemed less immediately accessible than the [low-level](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) version).





Project layout
-------------------------------------------------------------------------------

Each corpus is defined by subclassing the `Corpus` class, found in `timestextmining/corpora/common.py`, and registering that class in `timestextmining/corpora/__init__.py`. This class contains all information particular to a corpus that needs to be known for indexing, searching, and presenting a search form.


Running
-------------------------------------------------------------------------------

### Local instance

After configuring `timestextminer/config.py` (see `default-config.py`), setting up the ElasticSearch daemon and creating an index (`index.py`) and MySQL database (`create_database.py`), running `run.py` should create an instance of the server at `127.0.0.1:5000`.



Indexing
-------------------------------------------------------------------------------

`index.py` is, naturally, only used for indexing. As this should not be a situation that occurs often, a reminder: After `ssh`-ing into the server and `sudo su`-ing to a relevant user, do `script /dev/null` so that `screen` will not get [confused](http://serverfault.com/q/116775) from being called by a different user. Now, create and attach to a new `screen` session, or reattach with `screen -r <id>` to an existing ID in `screen -ls`. After activating the virtual environment, start indexing in the background with `./index.py times 1900-01-01 1999-12-31 &`. You can then detach with `screen -D` so that you can safely exit the terminal while indexing is in progress.
