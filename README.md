I-analyzer
===============================================================================


`ianalyzer/api` is a Python package that provides the following:

- An API that enables users to search through an ElasticSearch index of a text corpus, and stream search results into a CSV file. `Flask` is used for serving the interface and generating results.

- Underneath, the package provides a way to link together the source files of a corpus, corresponding entries in an ElasticSearch index, and the forms that enable users to query that index. XML data is parsed with `beautifulsoup4` + `lxml` and passed through to the index using the `elasticsearch` package for Python (note that `elasticsearch-dsl` is not used, since its [documentation](https://elasticsearch-dsl.readthedocs.io/en/latest) at the time seemed less immediately accessible than the [low-level](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) version).

`ianalyzer/web-ui` is an [Angular 4](https://angular.io/) web interface.


Project layout
-------------------------------------------------------------------------------

Each corpus is defined by subclassing the `Corpus` class, found in `timestextmining/corpora/common.py`, and registering that class in `timestextmining/corpora/__init__.py`. This class contains all information particular to a corpus that needs to be known for indexing, searching, and presenting a search form.

Prerequisites
-------------------------------------------------------------------------------

* Python 3
* MySQL daemon and libmysqlclient-dev
* [ElasticSearch](https://www.elastic.co/)

Running
-------------------------------------------------------------------------------

To get an instance running, do the following. Ideally run using a `virtualenv`:

1. Install the ElasticSearch (https://www.elastic.co/) and MySQL daemons on the server or your local machine.
2. Start your ElasticSearch Server. Make sure cross-origin handling is set up correctly for it to be accessible by the web user.
3. Install the PIP requirements.
```
cd api
pip install -r requirements.txt
```
4. Create the file `api/ianalyzer/config.py` (see `api/ianalyzer/default-config.py`). `ianalyzer/config.py` is included in .gitignore and thus not cloned to your machine. The variable `CORPUS` specifies for which corpus the application is made; `CORPUS_ENDPOINT` the associated python class in corpora; `CORPUS_URL` specifiies the url of the landing page of the web application.
5. Make sure that the source files for your corpora are available, and then create an ElasticSearch index from them by running, e.g., `python manage.py es -c dutchbanking -s 1785-01-01 -e 2010-12-31`, for indexing the Dutchbanking corpus starting in 1785 and ending in 2010. Defaults to CORPUS set in config, and the specified minimum and maximum dates otherwise.
6. If not already installed, install MySQL. Create a MySQL database through logging into MySQL through the shell.
7. Set up the database and migrations by running `python manage.py db init`.
8. Initialize the users of the MySQL database by running `python manage.py admin -p [password]`, providing an administrator password.
9. Run `python manage.py runserver` to create an instance of the Flask server at `127.0.0.1:5000`.
10. Go to `/web-ui` and follow the instructions in the README.

### Testing

Tests exist in the `api/tests/` directory and may be run by calling `python -m py.test`. Assess code coverage by running `coverage run --m py.test && coverage report`. Tests are also available for the `web-ui`, they should be run from that directory using Angular.



Indexing large corpora on the remote server
-------------------------------------------------------------------------------

1. If you are not indexing on your local machine, `ssh` into the server. After `sudo su`-ing to a relevant user, do `script /dev/null` so that `screen` will not get [confused](http://serverfault.com/q/116775) from being called by a different user. Now, create and attach to a new `screen` session, or reattach with `screen -r <id>` to an existing ID in `screen -ls`.
2. After activating the virtual environment, start indexing in the background with `./index.py times 1900-01-01 1999-12-31 &`, inserting the appropriate arguments: respectively the corpus name and the start- and end-timestamps of the documents.
3. If required, you can then detach with `screen -D` so that you can safely exit the terminal while indexing is in progress.
