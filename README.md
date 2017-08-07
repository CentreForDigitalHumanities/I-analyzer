I-analyzer
===============================================================================


`ianalyzer` is a Python package that provides the following:

- A front-end that enables users to search through an ElasticSearch index of a text corpus, and stream search results into a CSV file. `Flask` is used for serving the interface and generating results. On the client side, the interface uses `JQuery-UI`.

- Underneath, the package provides a way to link together the source files of a corpus, corresponding entries in an ElasticSearch index, and the forms that enable users to query that index. XML data is parsed with `beautifulsoup4` + `lxml` and passed through to the index using the `elasticsearch` package for Python (note that `elasticsearch-dsl` is not used, since its [documentation](https://elasticsearch-dsl.readthedocs.io/en/latest) at the time seemed less immediately accessible than the [low-level](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) version).



Project layout
-------------------------------------------------------------------------------

Each corpus is defined by subclassing the `Corpus` class, found in `timestextmining/corpora/common.py`, and registering that class in `timestextmining/corpora/__init__.py`. This class contains all information particular to a corpus that needs to be known for indexing, searching, and presenting a search form.



Running
-------------------------------------------------------------------------------

To get an instance running, do the following:

1. Install the ElasticSearch and MySQL daemons on the server or your local machine.
2. Configure `ianalyzer/config.py` (see `ianalyzer/default-config.py`). The variable `CORPUS` specifies for which corpus the application is made; `CORPUS_ENDPOINT` the associated python class in corpora; `CORPUS_URL` specifiies the url of the landing page of the web application.
3. Make sure that the source files for your corpora are available, and then create an ElasticSearch index from them by running, e.g., `manage.py es -c times -s 1785-01-01 -e 2010-12-31`, for indexing the Times corpus starting in 1785 and ending in 2010. Defaults to CORPUS set in config, and the specified minimum and maximum dates otherwise.
4. If not already installed, install MySQL. Create a MySQL database through logging into MySQL through the shell.
5. Set up the database and migrations by running `manage.py db init`.
6. Initialize the users of the MySQL database by running `manage.py admin -p password`, providing an administrator password.
7. Run `run.py` to create an instance of the Flask server at `127.0.0.1:5000`.

### Testing

Tests exist in the `tests/` directory and may be run by calling `python -m py.test`. Assess code coverage by running `coverage run --m py.test && coverage report`



Indexing
-------------------------------------------------------------------------------

`es_index.py` is used for indexing. As this should not be a situation that occurs often, a reminder.

1. If you are not indexing on your local machine, `ssh` into the server. After `sudo su`-ing to a relevant user, do `script /dev/null` so that `screen` will not get [confused](http://serverfault.com/q/116775) from being called by a different user. Now, create and attach to a new `screen` session, or reattach with `screen -r <id>` to an existing ID in `screen -ls`.
2. After activating the virtual environment, start indexing in the background with `./index.py times 1900-01-01 1999-12-31 &`, inserting the appropriate arguments: respectively the corpus name and the start- and end-timestamps of the documents.
3. If required, you can then detach with `screen -D` so that you can safely exit the terminal while indexing is in progress.
