[![Actions Status](https://github.com/UUDigitalHumanitiesLab/I-analyzer/workflows/Unit%20tests/badge.svg)](https://github.com/UUDigitalHumanitiesLab/I-analyzer/actions)

I-analyzer
===============================================================================

`ianalyzer/backend` is a Python package that provides the following:

- the models (user, role, corpus) and configuration files (in module ianalyzer)

- an 'api' module that enables users to search through an ElasticSearch index of a text corpus, and stream search results into a CSV file. `Flask` is used for serving the interface and generating results.

- An 'addcorpus' module which describes how to link together the source files of a corpus, corresponding entries in an ElasticSearch index, and the forms that enable users to query that index. XML data is parsed with `beautifulsoup4` + `lxml` and passed through to the index using the `elasticsearch` package for Python (note that `elasticsearch-dsl` is not used, since its [documentation](https://elasticsearch-dsl.readthedocs.io/en/latest) at the time seemed less immediately accessible than the [low-level](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) version).

- A 'corpora' module containing corpus definitions and metadata of the currently implemented coprora 

- An 'admin' module which describes the views for the admin interface (served through Flask)

- migration files and utitilies (using flask-migrate)

`ianalyzer/frontend` is an [Angular 4](https://angular.io/) web interface.

Project layout
-------------------------------------------------------------------------------

Each corpus is defined by subclassing the `Corpus` class, found in `addcorpus/common.py`, and registering that class in `backend/ianalyzer/config.py`. This class contains all information particular to a corpus that needs to be known for indexing, searching, and presenting a search form.

Prerequisites
-------------------------------------------------------------------------------

* Python >=3.4, <=3.7
* MySQL daemon and libmysqlclient-dev
* [ElasticSearch](https://www.elastic.co/)
* [RabbitMQ](https://www.rabbitmq.com/) (used by [Celery](http://www.celeryproject.org/))

The Wiki includes a [recipe for installing the prerequisites on Debian 10](https://github.com/UUDigitalHumanitieslab/I-analyzer/wiki/Local-Debian-I-Analyzer-setup).

Running
-------------------------------------------------------------------------------
Warning: do not try this on a Windows machine. You will grind to a halt installing the libxml library. Since the SAML integration libxml and libxmlsec1-dev is required to get I-Analyzer running. Install on a mac or a linux system (such as Ubuntu)

To get an instance running, do all of the following inside an activated `virtualenv`:

1. Install the ElasticSearch v.7 (https://www.elastic.co/) and MySQL daemons on the server or your local machine. To avoid a lot of errors, choose the option: install elasticsearch with .zip or .tar.gz. ES wil install everything in one folder, and not all over your machine, which happens with other options.
2. Start your ElasticSearch Server. Make sure cross-origin handling (the setting [http.cors.enabled](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-http.html)) is set up correctly, or a proxy has been configured, for the server to be accessible by the web user. For example, edit `elasticsearch.yml` to include the following:
```
http.cors.enabled: true
http.cors.allow-origin: "*"
```
3. Install the requirements for both the API and the client:
```
yarn postinstall
```
4. Create the file `backend/ianalyzer/config.py` (see `backend/ianalyzer/default-config.py`). `ianalyzer/config.py` is included in .gitignore and thus not cloned to your machine. The variable `CORPORA` specifies which corpora are available, and the path of the corpus module. Note that `config.py` should include the `CSRF_` settings for the front- and backend to communicate (in particular, PUTs and POSTs and the like shall not work without them). 
5. Go to `/backend`. See instructions below for Python package installation and dependency management.
6. Set up your configuration file. `default_config.py` contains some reasonable defaults. Set the location of the source files of your corpora (which are now available in a separate repository, ianalyzer-corpora).
7. Make sure that the source files for your corpora are available, and then create an ElasticSearch index from them by running, e.g., `flask es -c dutchannualreports -s 1785-01-01 -e 2010-12-31`, for indexing the Dutch Annual Reports corpus starting in 1785 and ending in 2010. Defaults to CORPUS set in config, and the specified minimum and maximum dates otherwise. (Note that new indices are created with `number_of_replicas` set to 0 (this is to make index creation easier/lighter). In production, you can automatically update this setting after index creation by adding the `--prod` flag (e.g. `flask es -c goodreads --prod`). Note though, that the `--prod` flag creates a _versioned_ index name, which needs an alias to actually work as `name_of_index_without_version` (see below for more details).
8. If not already installed, install MySQL. Create a MySQL database through logging into MySQL through the shell. Create a user that has all permissions. You need to set up in config.py the database user and password (SQLALCHEMY_DATABASE_URI='mysql://username:password@localhost:3306/databasename').
9. Set up the database and migrations by running `flask db upgrade`.
10. Initialize the admin and corpus roles in the MySQL database and create a superuser with all these roles by running `flask admin -n adminname`, providing an administrator name. You will be prompted for a password, and to repeat the password.
11. Run `flask run` to create an instance of the Flask server at `127.0.0.1:5000`.
12. Make sure you have rabbitmq installed for celery to work. Then, on a separte terminal window, from the `/backend` directory, run `celery -A ianalyzer.runcelery.celery_app worker --loglevel=info` to start your celery worker (currently used by long downloads and word cloud).
13. Go to `/frontend` and follow the instructions in the README to start it.

#### Production

14. On the servers, we work with aliases. Indices created with the `--prod` flag will have a version number (e.g. `indexname-1`), and as such will not be recognized by the corpus definition (which is looking for `indexname`). Create an alias for that using the `alias` command: `flask alias -c corpusname`. That script ensures that an alias is present for the index with the highest version numbers, and not for all others (i.e. older versions). The advantage of this approach is that an old version of the index can be kept in place as long as is needed, for example while a new version of the index is created. Note that removing an alias does not remove the index itself.

15. Once you have an alias in place, you might want to remove any old versions of the index. The `alias` command can be used for this. If you call `flask alias -c corpusname --clean` any versions of the index that are not the newest version will be removed. Note that removing an index also removes any existing aliases for it. You might want to perform this as a separate operation (i.e. after completing step 14) so that the old index stays in place for a bit while you check that all is fine.

### Python package management

Install `pip-tools` in your virtualenv. Run `pip-sync` or `pip install -r api/requirements.txt` in order to install all Python package dependencies. If you want to add a new package dependency, take the following steps:

 1. Add the package *without version number* to `api/requirements.in`,
 2. Run `pip-compile backend/requirements.in` (you can just `pip-compile` if you `cd backend` first). This will update the `backend/requirements.txt` with a pinned version that cooperates well with the other packages.
 3. Commit the changes to `backend/requirements.{in,txt}` at the same time.

The above steps do not actually install the package; you can do this at any stage using `pip install` or afterwards using `pip-sync`.

### Testing

Tests exist in the `backend/ianalyzer/tests/` directory and may be run by calling `pytest` (or `python -m pytest`) from `/backend`. Assess code coverage by running `coverage run --m py.test && coverage report`. Tests are also available for the `frontend`, they should be run from that directory using Angular.

When writing new backend tests, you can use the fixtures in `backend/ianalyzer/tests/conftest.py`. For example, you can do the following in order to test a view.

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
2. After activating the virtual environment, start indexing in the background with `./es_index.py times 1900-01-01 1999-12-31 &`, inserting the appropriate arguments: respectively the corpus name, the start- and end-timestamps of the documents and the `--prod` flag.
3. If required, you can then detach with `screen -D` so that you can safely exit the terminal while indexing is in progress.

SAML
-------------------------------------------------------------------------------
In order to login with Solis ID, I-analyzer has SAML integration with ITS. For this, it uses our custom class `dhlab_flask_saml.py` from the [dhlab-saml](https://github.com/UUDigitalHumanitieslab/dhlab-saml) repo. More information on working with SAML, setting up a local environment to test the SAML integration, etc. can be found there.

Note that the SAML integration relies on three variables in the config (see te default config), one of which you will need to adjust to get a working situation.

Set up with the current deployment script, the metadata will be generated automatically. No action required if the server is updated: the saml metadata, available at [](https://ianalyzer.hum.uu.nl/saml/metadata/) will update itself, as python3-saml will look for the cert in the folder specified in `SAML_FOLDER` (which simlinks to the server certificate files), and generate the metadata based on this.
