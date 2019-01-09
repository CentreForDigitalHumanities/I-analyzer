I-analyzer
===============================================================================

`ianalyzer/api` is a Python package that provides the following:

- the models (user, role, corpus) and configuration files (in module ianalyzer)

- an 'api' module that enables users to search through an ElasticSearch index of a text corpus, and stream search results into a CSV file. `Flask` is used for serving the interface and generating results.

- A 'corpora' module which describes how to link together the source files of a corpus, corresponding entries in an ElasticSearch index, and the forms that enable users to query that index. XML data is parsed with `beautifulsoup4` + `lxml` and passed through to the index using the `elasticsearch` package for Python (note that `elasticsearch-dsl` is not used, since its [documentation](https://elasticsearch-dsl.readthedocs.io/en/latest) at the time seemed less immediately accessible than the [low-level](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) version).

- An 'admin' module which describes the views for the admin interface (served through Flask)

- migragtion files and utitilies (using flask-migrate)

`ianalyzer/web-ui` is an [Angular 4](https://angular.io/) web interface.

Project layout
-------------------------------------------------------------------------------

Each corpus is defined by subclassing the `Corpus` class, found in `timestextmining/corpora/common.py`, and registering that class in `timestextmining/corpora/__init__.py`. This class contains all information particular to a corpus that needs to be known for indexing, searching, and presenting a search form.

Prerequisites
-------------------------------------------------------------------------------

* Python 3.4 or Python 3.5
* MySQL daemon and libmysqlclient-dev
* [ElasticSearch](https://www.elastic.co/)

Running
-------------------------------------------------------------------------------

To get an instance running, do all of the following inside an activated `virtualenv`:

1. Install the ElasticSearch (https://www.elastic.co/) and MySQL daemons on the server or your local machine.
2. Start your ElasticSearch Server. Make sure cross-origin handling (the setting [http.cors.enabled](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-http.html)) is set up correctly, or a proxy has been configured, for the server to be accessible by the web user. For example, edit `elasticsearch.yml` to include the following:
```
http.cors.enabled: true
http.cors.allow-origin: "*"
```
3. Install the requirements for both the API and the client with `npm install`.
```
npm install
```
4. Create the file `api/ianalyzer/config.py` (see `api/ianalyzer/default-config.py`). `ianalyzer/config.py` is included in .gitignore and thus not cloned to your machine. The variable `CORPORA` specifies which corpora are available, and the path of the corpus module. Note that `config.py` should include the `CSRF_` settings for the front- and backend to communicate (in particular, PUTs and POSTs and the like shall not work without them). 
5. Go to `/api`. See instructions below for Python package installation and dependency management.
6. Define that the startup code for the Flask application is located within manage.py by exporting / setting the environment variable:
- Mac/Linux:
```
export FLASK_APP=manage.py
```
- Windows:
```
set FLASK_APP=manage.py
```
7. Set up your configuration file. `default_config.py` contains some reasonable defaults. Set the location of the source files of your corpora (which are now available in a separate repository, ianalyzer-corpora).
8. Make sure that the source files for your corpora are available, and then create an ElasticSearch index from them by running, e.g., `flask es -c dutchannualreports -s 1785-01-01 -e 2010-12-31`, for indexing the Dutch Annual Reports corpus starting in 1785 and ending in 2010. Defaults to CORPUS set in config, and the specified minimum and maximum dates otherwise.
9. If not already installed, install MySQL. Create a MySQL database through logging into MySQL through the shell.
10. Set up the database and migrations by running `flask db upgrade`.
11. Initialize the admin and corpus roles in the MySQL database and create a superuser with all these roles by running `flask admin -n adminname`, providing an administrator name. You will be prompted for a password, and to repeat the password.
12. Run `flask run` to create an instance of the Flask server at `127.0.0.1:5000`.
13. Go to `/web-ui` and follow the instructions in the README to start it.

### Python package management

Install `pip-tools` in your virtualenv. Run `pip-sync` or `pip install -r api/requirements.txt` in order to install all Python package dependencies. If you want to add a new package dependency, take the following steps:

 1. Add the package *without version number* to `api/requirements.in`,
 2. Run `pip-compile api/requirements.in` (you can just `pip-compile` if you `cd api` first). This will update the `api/requirements.txt` with a pinned version that cooperates well with the other packages.
 3. Commit the changes to `api/requirements.{in,txt}` at the same time.

The above steps do not actually install the package; you can do this at any stage using `pip install` or afterwards using `pip-sync`.

### Testing

Tests exist in the `api/ianalyzer/tests/` directory and may be run by calling `python -m py.test` from `/api`. Assess code coverage by running `coverage run --m py.test && coverage report`. Tests are also available for the `web-ui`, they should be run from that directory using Angular.

When writing new backend tests, you can use the fixtures in `api/ianalyzer/tests/conftest.py`. For example, you can do the following in order to test a view.

```py
def test_some_view(app):
    with app.test_client() as client:
        response = client.get('/some/route')
        assert response.status_code == 200
        # etcetera
```

For further details, consult the source code in `api/ianalyzer/tests/conftest.py`.

Indexing large corpora on the remote server
-------------------------------------------------------------------------------

1. If you are not indexing on your local machine, `ssh` into the server. After `sudo su`-ing to a relevant user, do `script /dev/null` so that `screen` will not get [confused](http://serverfault.com/q/116775) from being called by a different user. Now, create and attach to a new `screen` session, or reattach with `screen -r <id>` to an existing ID in `screen -ls`.
2. After activating the virtual environment, start indexing in the background with `./es_index.py times 1900-01-01 1999-12-31 &`, inserting the appropriate arguments: respectively the corpus name and the start- and end-timestamps of the documents.
3. If required, you can then detach with `screen -D` so that you can safely exit the terminal while indexing is in progress.
