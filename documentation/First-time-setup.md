# First time setup (for developers)

These are instructions to set up an I-analyzer server. If you are going to develop I-analyzer, start by following these instructions.

## Prerequisites

* Python == 3.8
* PostgreSQL >= 10, client, server and C libraries
* [ElasticSearch](https://www.elastic.co/) 8. To avoid a lot of errors, choose the option: install elasticsearch with .zip or .tar.gz. ES wil install everything in one folder, and not all over your machine, which happens with other options.
* [Redis](https://www.redis.io/) (used by [Celery](http://www.celeryproject.org/)). Recommended installation is [installing from source](https://redis.io/docs/getting-started/installation/install-redis-from-source/)
* Yarn

The documentation includes a [recipe for installing the prerequisites on Debian 10](./documentation/Local-Debian-I-Analyzer-setup.md)

## First-time setup

For the SAML integration, the following libraries are required: xmlsec, python3-dev, libssl-dev and libsasl2-dev. This has been tested on Unix systems, but installation may be more difficult on Windows. As the dependencies on `xmlsec` are only called in the `settings_saml` module, however, they should not affect running the application when not explicitly using this settings module.

To get an instance running, do all of the following inside an activated `virtualenv`:

1. Install the ElasticSearch v.8 (https://www.elastic.co/) and postgreSQL on the server or your local machine. To avoid a lot of errors, choose the option: install elasticsearch with .zip or .tar.gz. ES wil install everything in one folder, and not all over your machine, which happens with other options.
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
4. Create and activate a virtualenv for Python.
5. Create the file `backend/ianalyzer/settings_local.py`.`ianalyzer/settings_local.py` is included in .gitignore and thus not cloned to your machine. The variable `CORPORA` specifies which corpora are available, and the path of the corpus definition file. This file is also the place to add corpus-specific configurations (like the location of source files). See instructions of adding corpora below.
6. Install the requirements for both the backend and frontend:
```
yarn postinstall
```
7. Set up your postgres database by going to the backend directory and running `psql -f create_db.sql`
The backend readme provides more details on these steps.
8. Set up the database and migrations by running `yarn django migrate`.
9. Make a superuser account with `yarn django createsuperuser`

## Setup with Docker
Alternatively, you can run the application via Docker:
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it.
2. Make an .env file next to this README, which defines the configuration for the SQL database and Redis. An example setup could look as follows:
```
SQL_HOST=db
SQL_PORT=5432
SQL_USER=myuser
SQL_DATABASE=mydb
SQL_PASSWORD=mysupersecretpassword
ES_HOST=elasticsearch
CELERY_BROKER=redis://redis
DATA_DIR=where/corpus/data/is/located/on/your/machine
```
3. Run `docker-compose up` from the directory of this README. This will pull images from the Docker registry and start containers based on these images. This will take a while to set up the first time. To stop, hit `ctrl-c`, run `docker-compose down` in another terminal, or use the Docker Desktop dashboard.
4. If you need to reinstall libraries via pip or yarn, use `docker-compose up --build`.

Note: you can also call the .env file .myenv and specify this during startup:
`docker-compose --env-file .myenv up`


## Adding corpora

To include corpora on your environment, you need to index them from their source files. The source files are not included in this directory; ask another developer about their availability. If you have (a sample of) the source files for a corpus, you can add it your our environment as follows:

_Note:_ these instructions are for indexing a corpus that already has a corpus definition. For adding new corpus definitions, see [How to add a new corpus to I-analyzer](./documentation/How-to-add-a-new-corpus-to-Ianalyzer.md).

1. Add the corpus to the `CORPORA` dictionary in your local settings file. The key should match the class name of the corpus definition. This match is not case-sensitive, and your key may include extra non-alphabetic characters (they will be ignored when matching). The value should be the absolute path the corpus definition file (e.g. `.../backend/corpora/times/times.py`).
2. Set configurations for your corpus. Check the definition file to see which variables it expects to find in the configuration. Some of these may already be set in settings.py, but you will at least need to define the (absolute) path to your source files.
3. Activate your python virtual environment. Create an ElasticSearch index from the source files by running, e.g., `yarn django index dutchannualreports`, for indexing the Dutch Annual Reports corpus in a development environment. See [Indexing](documentation/Indexing-corpora.md) for more information.

## Running a dev environment

1. Start your local elasticsearch server. If you installed from .zip or .tar.gz, this can be done by running `{path your your elasticsearch folder}/bin/elasticsearch`
2. Activate your python environment. Start the backend server with `yarn start-back`. This creates an instance of the Django server at `127.0.0.1:8000`.
3. (optional) If you want to use celery, start your local redis server by running `redis-server` in a separate terminal.
4. (optional) If you want to use celery, activate your python environment. Run `yarn celery worker`. Celery is used for long downloads and the word cloud and ngrams visualisations.
5. Start the frontend by running `yarn start-front`.
