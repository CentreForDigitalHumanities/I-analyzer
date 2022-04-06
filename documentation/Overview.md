# Overview

The application consists of a backend (api), implemented in [Python Flask](http://flask.pocoo.org/) and a frontend (web-ui) implemented in [Angular](https://angular.io/).

# Backend

The backend has three responsibilities: 
- managing the database containing information on users and access rights to corpora
- communication with Elasticsearch
- analysis tasks

`ianalyzer/config.py` is the source of truth for all kinds of settings and variables; this file is not shared via github, and placed in the private folder during deployment. `ianalyzer/default_config.py` provides some sensible defaults, which `ianalyzer/config_fallback.py` calls if it cannot find any values from `config.py`.

### Initialization
The Flask application is initialized through a factory function (`flask_app`) in `factories.py`. Note that during development, this function is called from `manage.py`. Strangely, it imports the dependencies of the app (e.g. the Flask admin instance) from `web.py`. This pattern occurs also in production: there the WSGI file that loads the application imports the dependencies from `web.py` and passes them to the factory function to initialize the app.

### Database
The database can use any flavour of SQL. We use [SQLAlchemy](https://www.sqlalchemy.org/) and [flask-migrate](https://flask-migrate.readthedocs.io/en/latest/) to create and migrate the database. The top-level `manage.py` provides commands to do this from the command line (see also README.md). The tables of the databaseare defined in `ianalyzer/models.py`, and this is also where the client connecting to the database is created. The location of the database and access credentials are saved in `ianalyzer/config.py`.

The following models are important: `User` defines users, passwords etc., Users have a `Role`, which gives them access to a collection of corpora. Therefore, `Role` has a foreign key (many-to-many) with `Corpus`, which corresponds to the Elasticsearch indices a user can access (which is checked on the frontend as a `Corpus` object's `name`).

Through [flask-admin](https://flask-admin.readthedocs.io/en/latest/), `ianalyzer/views.py` provides the admin interface of the application: Users, Role and Corpus objects can be created and edited. This interface lives next to the frontend provided through Angular, and is only accessible to superusers.

### Elasticsearch
The backend provides functionality to make an Elasticsearch index through the commandline: `manage.py` calls `es_index.py` to do so. `es_index.py` in turn relies on the settings in `ianalyzer/config.py` of where the corpus definitions and the source data are located. The corpus definitions of already integrated corpora are currently bundled in `ianalyzer/corpora`. The corpus definitions can be located anywhere on the filesystem, however.

Currently, the frontend constructs the request body as an Elasticsearch Simple Query String, and this is forwarded by the backend to Elasticsearch (in `ianalyzer/forward_es.py`). The response from Elasticsearch is then passed back to the frontend.

### Analysis
`analyze.py` contains scripts to
- construct a frequency table of words from the results' content (passed in from frontend)
- conduct analysis for the wordcloud, histogram, timeline, ngrams and related words visualisations in the frontend

# Frontend

The core of the frontend application is the `src/app/search/search.component`, providing the template for the user interface. `search.component` itself is responsible for checking if any new search terms have been entered in the search field, and if so, to use `search.service` (which in turn uses `elasticsearch.service`) in `src/app/services` to translate the search query into an Elasticsearch Simple Query string. To do so, it also checks for events coming in from `search-filter.component`, which provides templates and default values for the various filters.

There are various visualizations in `src/app/visualization/`, with `visualization.component` as the main component which checks which visualization type is to be displayed. As a rule, visualisations that directly show the results of an aggregation search call Elasticsearch internally, while other visualizations (wordcloud, related words, ngram, term frequency) query information via `api.service` from the Python backend.

For more about users, authentication and authorization, see [Authentication and authorization](./Authentication-and-authorization.md)
