# Django project settings

This file describes how to configure project settings in Django.

## Different settings files

We keep different settings files to handle different environments.

`settings.py` is the default settings file in a development file. The version in the repository is replaced in our deployment setup. This means that what you write here will affect all development environments, but not production environments.

`common_settings.py` is intended for "universal" project settings that apply in both production and development servers. It is imported by `settings.py` on both development and production.

`settings_local.py` is ignored in version control, but the development configuration `settings.py` will attempt to import it. This file can be used for sensitive information configurations that are unique to your setup, such as which corpora you're using. You can also use this to override any existing settings.

`settings_test.py` is used during unit tests. It imports everything configured in `settings.py`, but can add or override some settings. Note that you can also adjust settings for individual tests.

### Using a different settings module

Django supports using a different settings module ([more about settings in Django](https://docs.djangoproject.com/en/5.0/topics/settings/)).

However, the Celery configuration depends on `settings.py`, so when you run a command like `celery -A ianalyzer worker`, Celery will use the `settings.py` in `/backend/ianalyzer`.

This mean that you cannot simply point to an alternative settings module if you also need a celery worker; you should overwrite the `settings.py` file in `/backend/ianalyzer` before starting the worker.

## Project settings

For project settings supported by external libraries, see:

- [Django settings reference](https://docs.djangoproject.com/en/5.0/ref/settings/)
- [configuration for Django REST framework](https://www.django-rest-framework.org/api-guide/settings/)
- [configuration for dj-rest-auth](https://dj-rest-auth.readthedocs.io/en/latest/configuration.html)
- [configuration for djangosaml2](https://djangosaml2.readthedocs.io/contents/setup.html#configuration)
- [configuration for Celery](https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html)

In addition, I-analyzer add the following settings.

### `SERVERS`

Configuration of elasticsearch servers. This is a dictionary. The keys are the (internal) names you give to each server. (You can connnect more than one server, though most of the time, you only need one.)

The values in the dictionary give specifications.

- `'host'` and `'port'` specify the address where you access the server
- `'chunk_size'`: Maximum number of documents sent during ES bulk operation
- `'max_chunk_bytes'`: Maximum size of ES chunk during bulk operation
- `'bulk_timeout'`: Timeout of ES bulk operation
- `'scroll_timeout'`: Time before scroll results time out
- `'scroll_page_size'`: Number of results per scroll page

The following settings may appear in legacy configurations, but are no longer supported:

- `'username'`
- `'password'`
- `'overview_query_size'`

The following optional settings are implemented but have no documentation:

- `'certs_location'`
- `'api_key'`
- `'api_id'`

#### Setting a default server

If you name one of the servers `'default'`, it will act as the default for all corpora. This is especially recommended if you have only one server.

If you don't assign a default server this way, the server for each corpus must be configured explicitly in `CORPUS_SERVER_NAMES` (see below).

### `CORPORA`

A dictionary that specifies Python corpus definitions that should be imported in your project.

Each key must be the name of a corpus, where the value gives the absolute path to the Python file that contains the definition. For example:

```python
CORPORA = {
    'times': '/home/me/ianalyzer/backend/corpora/times/times.py',
}
```

The key of the corpus must match the name of the corpus class. This match is not case-sensitive, and your key may include extra non-alphabetic characters (they will be ignored when matching). For example, `'times'` is a valid key for the `Times` class. It will usually match the filename as well, but this is not strictly necessary.

### `CORPUS_SERVER_NAMES`

A dictionary that specifies which elasticsearch server should be used for which corpus.

Each key in the dictionary should be the name for a corpus, i.e. one of the keys in the `CORPORA` setting. Each value should be the name for an elasticsearch server, i.e. one of the keys in the `SERVERS` setting.

You do not need to include corpora which use the `'default'` server.

### `LOGO_LINK`

URL of the logo of your organisation. This is used in emails sent to users.

### `DEFAULT_FROM_EMAIL`

The address from which emails to users should be sent.

By default, a development server will use the [console backend](https://docs.djangoproject.com/en/5.0/topics/email/#console-backend) for emails, where it does not really matter what you fill in here.

### `NLTK_DATA_PATH`

A directory where corpora downloaded from [NLTK](https://nltk.readthedocs.io/en/latest/) can be stored.

### `CSV_FILES_PATH`

Path to the directory where prepared download files for users should be stored.

### `WORDCLOUD_LIMIT`

The maximum number of documents that is analysed in the wordcloud (a.k.a. "most frequent words") visualisation.

### `DIRECT_DOWNLOAD_LIMIT`

The frontend clients has two methods for downloading search results; when the user clicks "download", they can either receive the file in the same session, or be sent an email with a download link. The latter method is more suitable for large downloads.

This setting controls the limit of when files can be downloaded directly.

### `BASE_URL`

The base URL for the application. This URL can be used to generate links to the frontend in emails and citation templates.

### `NEW_HIGHLIGHT_CORPORA`

List of corpora that have been re-indexed, so that the top-level term vectors for main content fields include positions and offsets. This is needed for the updated highlight functionality that was introduced in version 4.2.0 of I-analyzer.

The list should contain the _titles_ (not names) of updated corpora. You only need to list corpora with a Python definition; legacy highlighting is not supported for database-only corpora.

### `SAML_GROUP_NAME`

Optional, should be a string.

If you define a `SAML_GROUP_NAME` in settings, SAML users will always be added to a group with that name when they create an account. (The group will be created if it does not exist.) This can be used to give permissions to SAML users. The group is not used to handle authentication, so you can add non-SAML users to it as well.

### `DEFAULT_CORPUS_IMAGE`

A path (string) to an image file.

Corpora can include an image to use in the interface (e.g. in the corpus selection menu); if the corpus has no image, this one will be used instead.

### Settings for individual corpora

Python corpus definitions typically rely on the Django settings, to avoid hard-coding properties that depend on the server. When you include a corpus definition in your settings, read the source file to see the related settings. Some of these settings may be optional.
