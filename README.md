[![Actions Status](https://github.com/UUDigitalHumanitiesLab/I-analyzer/workflows/Unit%20tests/badge.svg)](https://github.com/UUDigitalHumanitiesLab/I-analyzer/actions)

# I-analyzer

The text mining tool that obviates all others.

I-analyzer is a web application that allows users to search through large text corpora, requiring no experience in text mining or technical know-how.

## Directory structure

The I-analyzer backend (`/backend`) is a python/Flask app that provides the following functionality:

- A 'corpora' module containing corpus definitions and metadata of the currently implemented coprora. For each corpus added in I-analyzer, this module dfines how to extract document contents from its source files and sets parameters for displaying the corpus in the interface, such as sorting options.

- An 'addcorpus' module which manages the functionality to extract data from corpus source files (given the definition) and save this in an elasticsearch index. Source files can be XML or HTML format (which are parsed with `beautifulsoup4` + `lxml`) or CSV. This module also provides the basic data structure for corpora.

- An 'es' module which handles the communication with elasticsearch. The data is passed through to the index using the `elasticsearch` package for Python (note that `elasticsearch-dsl` is not used, since its [documentation](https://elasticsearch-dsl.readthedocs.io/en/latest) at the time seemed less immediately accessible than the [low-level](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) version).

- The main 'ianalyzer' module which defines the models for the SQL database (user, role, corpus) and configuration files.

- An 'api' module that that enables users to search through an ElasticSearch index of a text corpus and stream search results into a CSV file. The module also performs more complex analysis of search results for visualisations.

- A 'wordmodels' module that handles functionality related to word embeddings.

- An 'admin' module which describes the views for the admin interface (served through Flask)

`ianalyzer/frontend` is an [Angular 13](https://angular.io/) web interface.

See the documentation for [a more extensive overview](./documentation/Overview.md)

## Prerequisites

* Python == 3.8
* MySQL daemon and libmysqlclient-dev
* [ElasticSearch](https://www.elastic.co/) 8. To avoid a lot of errors, choose the option: install elasticsearch with .zip or .tar.gz. ES wil install everything in one folder, and not all over your machine, which happens with other options.
* [Redis](https://www.redis.io/) (used by [Celery](http://www.celeryproject.org/)). Recommended installation is [installing from source](https://redis.io/docs/getting-started/installation/install-redis-from-source/)

If you wish to have email functionality, also make sure you have an email server set up, such as [maildev](https://maildev.github.io/maildev/).

The documentation includes a [recipe for installing the prerequisites on Debian 10](./documentation/Local-Debian-I-Analyzer-setup.md)

## First-time setup

Warning: do not try this on a Windows machine. You will grind to a halt installing the libxml library. Since the SAML integration libxml and libxmlsec1-dev is required to get I-Analyzer running. Install on a mac or a linux system (such as Ubuntu)

To get an instance running, do all of the following inside an activated `virtualenv`:

1. Install the ElasticSearch v.8 (https://www.elastic.co/) and MySQL daemons on the server or your local machine. To avoid a lot of errors, choose the option: install elasticsearch with .zip or .tar.gz. ES wil install everything in one folder, and not all over your machine, which happens with other options.
2. For an easy setup, locate the file `config/elasticsearch.yaml` in your Elasticsearch directory, and set the variable `xpack.security.enabled: false`. Alternatively, you can leave this on its default value(`true`), but then you need to [generate API keys](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-create-api-key.html) and set up your SERVERS config like so:
```
SERVERS = {
    # Default ElasticSearch server
    'default': {
        'host': 'localhost',
        'port': 9200,
        'certs_location': '{your_elasticsearch_directory/config/certs/http_ca.crt}'
        'api_id': '{generated_api_id}'
        'api_key': '{generated_api_key}'
    }
}
```
3. Start your ElasticSearch Server. Make sure cross-origin handling (the setting [http.cors.enabled](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-http.html)) is set up correctly, or a proxy has been configured, for the server to be accessible by the web user. For example, edit `elasticsearch.yml` to include the following:
```
http.cors.enabled: true
http.cors.allow-origin: "*"
```
4. Install the requirements for both the API and the client:
```
yarn postinstall
```
4. Create the file `backend/ianalyzer/config.py` (see `backend/ianalyzer/default-config.py`). `ianalyzer/config.py` is included in .gitignore and thus not cloned to your machine. The variable `CORPORA` specifies which corpora are available, and the path of the corpus module. See instructions of adding corpora below. Note that `config.py` should include the `CSRF_` settings for the front- and backend to communicate (in particular, PUTs and POSTs and the like shall not work without them).
5. Go to `/backend`. See instructions below for Python package installation and dependency management.
6. Set up your configuration file. `default_config.py` contains some reasonable defaults. If you are working with the csv download functionality, be sure to update the csv path to the absolute path to backend/api/csv_files.
7. Create a MySQL database through logging into MySQL through the shell. Create a user that has all permissions. You need to set up in config.py the database user and password (SQLALCHEMY_DATABASE_URI='mysql://username:password@localhost:3306/databasename').
8. Set up the database and migrations by running `flask db upgrade`.
9. Initialize the admin and corpus roles in the MySQL database and create a superuser with all these roles by running `flask admin -n adminname`, providing an administrator name. You will be prompted for a password, and to repeat the password.
10. Go to `/frontend` and follow the instructions in the README to install it.
11. If you wish to run Redis from a non-default hostname and/or port, or pick which database to use, specify this in your config.py as CELERY_BROKER_URL=redis://host:port/db_number; do the same for CELERY_BACKEND.

## Adding corpora

To include corpora on your environment, you need to index them from their source files. The source files are not included in this directory; ask another developer about their availability. If you have (a sample of) the source files for a corpus, you can add it your our environment as follows:

_Note:_ these instructions are for adding a corpus that already has a corpus definition. For adding new corpora, see [How to add a new corpus to I-analyzer](./documentation/How-to-add-a-new-corpus-to-Ianalyzer.md).

1. Add the corpus to the `CORPORA` dictionary in your local configuration file. The key should match the class name of the corpus definition. This match is not case-sensitive, and your key may include extra non-alphabetic characters (they will be ignored when matching). The value should be the absolute path the corpus definition file (e.g. `.../backend/corpora/times/times.py`).
2. Set configurations for your corpus. Check the definition file to see which variables it expects to find in the configuration. Some of these may already be set in default_config.py, but you will need to define the name of the elasticsearch index and the (absolute) path to your source files.
3. Create an ElasticSearch index from the source files by running, e.g., `flask es -c dutchannualreports -s 1785-01-01 -e 2010-12-31`, for indexing the Dutch Annual Reports corpus starting in 1785 and ending in 2010. Defaults to CORPUS set in config, and the specified minimum and maximum dates otherwise. (Note that new indices are created with `number_of_replicas` set to 0 (this is to make index creation easier/lighter). In production, you can automatically update this setting after index creation by adding the `--prod` flag (e.g. `flask es -c goodreads --prod`). Note though, that the
`--prod` flag creates a _versioned_ index name, which needs an alias to actually work as `name_of_index_without_version` (see below for more details).

#### Production

On the servers, we work with aliases. Indices created with the `--prod` flag will have a version number (e.g. `indexname-1`), and as such will not be recognized by the corpus definition (which is looking for `indexname`). Create an alias for that using the `alias` command: `flask alias -c corpusname`. That script ensures that an alias is present for the index with the highest version numbers, and not for all others (i.e. older versions). The advantage of this approach is that an old version of the index can be kept in place as long as is needed, for example while a new version of the index is created. Note that removing an alias does not remove the index itself.

Once you have an alias in place, you might want to remove any old versions of the index. The `alias` command can be used for this. If you call `flask alias -c corpusname --clean` any versions of the index that are not the newest version will be removed. Note that removing an index also removes any existing aliases for it. You might want to perform this as a separate operation (i.e. after completing step 14) so that the old index stays in place for a bit while you check that all is fine.

See the documentation for more information about [indexing on the server](./documentation/Indexing-on-server.md).

## Running a dev environment

1. Start your local elasticsearch server. If you installed from .zip or .tar.gz, this can be done by running `{path your your elasticsearch folder}/bin/elasticsearch`
2. Activate your python environment. From `/backend`, start flask by running `flask run`. This creates an instance of the Flask server at `127.0.0.1:5000`.
3. (optional) If you want to use celery, start your local redis server by running `redis-server` in a separate terminal.
4. (optional) If you want to use celery, activate your python environment. From the backend folder, run `celery -A ianalyzer.runcelery.celery_app worker --loglevel=info`. Celery is used for long downloads and the word cloud and ngrams visualisations.
5. (optional) If you want to use email functionality, start your local email server.
6. Start the frontend by going to `/frontend` and running `yarn start`

## Notes for development

### Python package management

Install `pip-tools` in your virtualenv. Run `pip-sync` or `pip install -r api/requirements.txt` in order to install all Python package dependencies. If you want to add a new package dependency, take the following steps:

 1. Add the package *without version number* to `api/requirements.in`,
 2. Run `pip-compile backend/requirements.in` (you can just `pip-compile` if you `cd backend` first). This will update the `backend/requirements.txt` with a pinned version that cooperates well with the other packages.
 3. Commit the changes to `backend/requirements.{in,txt}` at the same time.

The above steps do not actually install the package; you can do this at any stage using `pip install` or afterwards using `pip-sync`.


### Testing

Backend tests exist in the `backend` directory. They are typically located in a `tests` subdirectory of the module they apply to. Run tests by calling `pytest` (or `python -m pytest`) from `/backend`. Assess code coverage by running `coverage run --m py.test && coverage report`.

When writing new backend tests, you can use the fixtures in the `conftest.py` for the module. For example, in the `api` module, you can do the following in order to test a view.

```py
def test_some_view(test_app):
    with test_app.test_client() as client:
        response = client.get('/some/route')
        assert response.status_code == 200
        # etcetera
```

For further details, consult the source code in `conftest.py`.

Tests are also available for the `frontend`, they should be run from that directory using Angular. Frontend tests can be run with `yarn test`.
