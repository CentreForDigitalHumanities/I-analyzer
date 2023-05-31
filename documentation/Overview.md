# Overview

The application consists of a backend, implemented in [Django](https://www.djangoproject.com/) and a frontend implemented in [Angular](https://angular.io/).

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
