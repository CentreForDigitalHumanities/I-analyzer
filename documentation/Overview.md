The application consists of a backend (api), implemented in [Python Flask](http://flask.pocoo.org/) and a frontend (web-ui) implemented in [Angular](https://angular.io/).

# Backend
```
api
├── es_index.py
├── ianalyzer
│   ├── __init__.py
│   ├── analyze.py
│   ├── assets
│   │   └── scss
│   │       └── search.scss
│   ├── config.py
│   ├── config_fallback.py
│   ├── corpora
│   │   ├── __init__.py
│   │   ├── common.py
│   │   ├── dutchbanking.py
│   │   ├── dutchnewspapers.py
│   │   ├── images
│   │   │   ├── dutchbanking.jpg
│   │   │   ├── dutchnewspapers.jpg
│   │   │   ├── jewish_inscriptions.jpg
│   │   │   ├── times.jpg
│   │   │   ├── times_thumb.jpg
│   │   │   └── troon.jpg
│   │   ├── jewishinscriptions.py
│   │   ├── spectators.py
│   │   ├── times.py
│   │   ├── tml.py
│   │   ├── troonredes.py
│   │   └── wm
│   │       ├── binned.pkl
│   │       └── complete.pkl
│   ├── default_config.py
│   ├── extract.py
│   ├── factories.py
│   ├── filters.py
│   ├── forms.py
│   ├── forward_es.py
│   ├── models.py
│   ├── security.py
│   ├── streaming.py
│   ├── templates
│   │   └── admin
│   │       ├── form.html
│   │       ├── index.html
│   │       └── master.html
│   ├── tests
│   │   ├── TDA_GDA
│   │   │   └── TDA_GDA_1785-2009
│   │   │       └── 1970
│   │   │           └── 19700101
│   │   │               └── 0FFO-1970-JAN01.xml
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_corpusimport.py
│   │   ├── test_forward_es.py
│   │   └── test_times.py
│   ├── views.py
│   └── web.py
├── ianalyzer.py
├── manage.py
├── migrations
│   ├── README
│   ├── alembic.ini
│   ├── env.py
│   ├── script.py.mako
│   └── versions
│       ├── 361d399102d9_.py
│       ├── 3e90c0a00e10_.py
│       ├── 75ad232e76b9_use_consistent_string_lengths.py
│       ├── a5ce6a370720_initial_version.py
│       └── b96a734631cb_changing_query_corpus_to_corpus_name.py
├── requirements.in
├── requirements.txt
├── setup.py
└── start-ianalyzer.py
```

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


# Frontend
```
web-ui/src
├── _primeng.scss
├── _utilities.scss
├── app
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.component.ts
│   ├── app.module.ts
│   ├── balloon.directive.ts
│   ├── corpus-selection
│   │   ├── corpus-selection.component.html
│   │   ├── corpus-selection.component.scss
│   │   └── corpus-selection.component.ts
│   ├── corpus.guard.ts
│   ├── document-view
│   │   ├── document-view.component.html
│   │   ├── document-view.component.scss
│   │   ├── document-view.component.spec.ts
│   │   └── document-view.component.ts
│   ├── dropdown
│   │   ├── dropdown.component.html
│   │   ├── dropdown.component.scss
│   │   ├── dropdown.component.spec.ts
│   │   └── dropdown.component.ts
│   ├── home
│   │   ├── home.component.html
│   │   ├── home.component.scss
│   │   └── home.component.ts
│   ├── logged-on.guard.ts
│   ├── login
│   │   ├── login.component.html
│   │   ├── login.component.scss
│   │   ├── login.component.spec.ts
│   │   └── login.component.ts
│   ├── manual
│   │   ├── manual-dialog.component.html
│   │   ├── manual-dialog.component.scss
│   │   ├── manual-dialog.component.ts
│   │   ├── manual-navigation.component.html
│   │   ├── manual-navigation.component.scss
│   │   ├── manual-navigation.component.ts
│   │   ├── manual.component.html
│   │   ├── manual.component.scss
│   │   └── manual.component.ts
│   ├── menu
│   │   ├── menu.component.html
│   │   ├── menu.component.scss
│   │   ├── menu.component.spec.ts
│   │   └── menu.component.ts
│   ├── models
│   │   ├── corpus.ts
│   │   ├── found-document.ts
│   │   ├── index.ts
│   │   ├── query.ts
│   │   ├── search-filter-data.ts
│   │   ├── search-results.ts
│   │   ├── sort-event.ts
│   │   ├── user-role.ts
│   │   └── user.ts
│   ├── notifications
│   │   ├── notifications.component.html
│   │   ├── notifications.component.scss
│   │   └── notifications.component.ts
│   ├── scroll-to.directive.ts
│   ├── search
│   │   ├── highlight.pipe.ts
│   │   ├── index.ts
│   │   ├── search-filter.component.html
│   │   ├── search-filter.component.scss
│   │   ├── search-filter.component.spec.ts
│   │   ├── search-filter.component.ts
│   │   ├── search-relevance.component.html
│   │   ├── search-relevance.component.scss
│   │   ├── search-relevance.component.spec.ts
│   │   ├── search-relevance.component.ts
│   │   ├── search-results.component.html
│   │   ├── search-results.component.scss
│   │   ├── search-results.component.spec.ts
│   │   ├── search-results.component.ts
│   │   ├── search-sorting.component.html
│   │   ├── search-sorting.component.scss
│   │   ├── search-sorting.component.spec.ts
│   │   ├── search-sorting.component.ts
│   │   ├── search.component.html
│   │   ├── search.component.scss
│   │   ├── search.component.spec.ts
│   │   ├── search.component.ts
│   │   ├── select-field.component.html
│   │   ├── select-field.component.scss
│   │   ├── select-field.component.spec.ts
│   │   └── select-field.component.ts
│   ├── search-history
│   │   ├── history-query-display.component.html
│   │   ├── history-query-display.component.scss
│   │   ├── history-query-display.component.spec.ts
│   │   ├── history-query-display.component.ts
│   │   ├── index.ts
│   │   ├── search-history.component.html
│   │   ├── search-history.component.scss
│   │   ├── search-history.component.spec.ts
│   │   └── search-history.component.ts
│   ├── services
│   │   ├── api-retry.service.ts
│   │   ├── api.service.mock.ts
│   │   ├── api.service.ts
│   │   ├── config.service.ts
│   │   ├── corpus.service.spec.ts
│   │   ├── corpus.service.ts
│   │   ├── data.service.spec.ts
│   │   ├── data.service.ts
│   │   ├── download.service.spec.ts
│   │   ├── download.service.ts
│   │   ├── elastic-search.service.mock.ts
│   │   ├── elastic-search.service.ts
│   │   ├── highlight.service.spec.ts
│   │   ├── highlight.service.ts
│   │   ├── index.ts
│   │   ├── log.service.ts
│   │   ├── manual.service.mock.ts
│   │   ├── manual.service.ts
│   │   ├── notification.service.ts
│   │   ├── query.service.spec.ts
│   │   ├── query.service.ts
│   │   ├── search.service.mock.ts
│   │   ├── search.service.spec.ts
│   │   ├── search.service.ts
│   │   ├── session.service.ts
│   │   ├── user.service.mock.ts
│   │   ├── user.service.spec.ts
│   │   └── user.service.ts
│   └── visualization
│       ├── barchart.component.html
│       ├── barchart.component.scss
│       ├── barchart.component.spec.ts
│       ├── barchart.component.ts
│       ├── freqtable.component.html
│       ├── freqtable.component.scss
│       ├── freqtable.component.spec.ts
│       ├── freqtable.component.ts
│       ├── timeline.component.html
│       ├── timeline.component.scss
│       ├── timeline.component.spec.ts
│       ├── timeline.component.ts
│       ├── timescale.js
│       ├── visualization.component.html
│       ├── visualization.component.scss
│       ├── visualization.component.spec.ts
│       ├── visualization.component.ts
│       ├── wordcloud.component.html
│       ├── wordcloud.component.scss
│       ├── wordcloud.component.spec.ts
│       └── wordcloud.component.ts
├── assets
│   ├── config.json
│   ├── dhlab.png
│   ├── favicon.png
│   ├── logo.png
│   └── manual
│       ├── en-GB
│       │   ├── main.md
│       │   ├── manifest.json
│       │   └── query.md
│       └── nl-NL
│           ├── manifest.json
│           └── query.md
├── environments
│   ├── environment.prod.ts
│   └── environment.ts
├── index.html
├── main.ts
├── mock-data
│   └── corpus.ts
├── polyfills.ts
├── styles.scss
├── test.ts
├── tsconfig.app.json
├── tsconfig.spec.json
└── typings.d.ts
```

The core of the frontend application is the `src/app/search/search.component`, providing the template for the user interface. `search.component` itself is responsible for checking if any new search terms have been entered in the search field, and if so, to use `search.service` (which in turn uses `elasticsearch.service`) in `src/app/services` to translate the search query into an Elasticsearch Simple Query string. To do so, it also checks for events coming in from `search-filter.component`, which provides templates and default values for the various filters.

There are various visualizations in `src/app/visualization/`, with `visualization.component` as the main component which checks which visualization type is to be displayed, and calling on `search.service` for the appropriate data. As a rule, keyword fields call Elasticsearch internally, while other visualizations (wordcloud, related words) query information via `api.service` from the Python backend.

For more about users, authentication and authorization, see [Authentication and authorization](./Authentication-and-authorization)
