# Overview

The application consists of a backend, implemented in [Django](https://www.djangoproject.com/) and a frontend implemented in [Angular](https://angular.io/).

## Directory structure

The I-analyzer backend (`/backend`) is a python/Django app that provides the following functionality:

- A 'users' module that defines user accounts.

- A 'corpora' module containing corpus definitions and metadata of the currently implemented corpora. For each corpus added in I-analyzer, this module defines how to extract document contents from its source files and sets parameters for displaying the corpus in the interface, such as sorting options.

- An 'addcorpus' module which manages the functionality to extract data from corpus source files (given the definition) and save this in an elasticsearch index. Source files can be XML or HTML format (which are parsed with `beautifulsoup4` + `lxml`) or CSV. This module also provides the basic data structure for corpora.

- An 'es' module which handles the communication with elasticsearch. The data is passed through to the index using the `elasticsearch` package for Python (note that `elasticsearch-dsl` is not used, since its [documentation](https://elasticsearch-dsl.readthedocs.io/en/latest) at the time seemed less immediately accessible than the [low-level](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) version).

- An 'api' module that that enables users to search through an ElasticSearch index of a text corpus and stream search results into a CSV file. The module also performs more complex analysis of search results for visualisations.

- A 'visualizations' module that does the analysis for several types of text-based visualisations.

- A 'downloads' module that collects results into csv files.

- A 'wordmodels' module that handles functionality related to word embeddings.

`ianalyzer/frontend` is an [Angular 13](https://angular.io/) web interface.

# Backend

The backend has three responsibilities:
- managing the database containing information on users and access rights to corpora
- communication with Elasticsearch
- analysis tasks

`ianalyzer/settings.py` is the source of truth for all kinds of settings and variables. Local envirnment settings can be added in `ianalyzer/settings_local.py`, which will be imported in the settings file.

### Database
The database uses postgreSQL. The top-level `manage.py` provides commands to run migrations from the command line (see also README.md). The tables of the databaseare defined `models.py` files for each app in the backend. The location of the database and access credentials are provide in `ianalyzer/settings.py` (or `settings_local.py`).

The following models are important: `CustomUser` add additional fields to Django's `User` model. Users are linked to `Group`s, which gives them access to a collection of corpora. Therefore, `Group` has a foreign key (many-to-many) with `Corpus`, which corresponds to the names of corpora a user can access.

In addition, the `Query` and `Download` models are used for the user's search and download history, respectively.

Django provides an admin intervace for the application: Users and Groups objects can be created and edited, and Corpora can be linked to Groups. This interface lives next to the frontend provided through Angular, and is only accessible to staff users.

### Elasticsearch
The backend provides functionality to make an Elasticsearch index through the command line: `manage.py` calls `es_index.py` to do so. `es_index.py` in turn relies on the settings in `ianalyzer/settings.py` of where the corpus definitions and the source data are located. The corpus definitions of already integrated corpora are currently bundled in `backend/corpora`. The corpus definitions can be located anywhere on the filesystem, however.

Currently, the frontend constructs the request body, largely based on an Elasticsearch Simple Query String, and this is forwarded by the backend to Elasticsearch (in `es/views.py`). The response from Elasticsearch is then passed back to the frontend.

### Analysis
The backend also contains functions to:
- conduct analysis for the wordcloud, term frequency, ngrams and related words visualisations in the frontend.
- assemble CSV downloads of search results.

# Frontend

The core of the frontend application is the `src/app/search/search.component`, providing the template for the user interface. This interface allows users to query results using Simple Query String syntax and offers various filters. The search component can show either the search results component, which shows documents matching the search, or visualisations.

There are various visualizations in `src/app/visualization/`, with `visualization.component` as the main component which checks which visualization type is to be displayed. As a rule, visualisations that directly show the results of an aggregation search formulate aggregation request in the frontent, while other visualizations (wordcloudngram, term frequency) let the backend handle analysis.

For corpora with word models, the `src/app/word-models/` provides an interface with various visualisations for viewing word similarity.


For more about users, authentication and authorization, see [Authentication and authorization](./Authentication-and-authorization.md)
