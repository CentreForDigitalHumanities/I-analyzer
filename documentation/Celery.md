# Celery

The backend uses [celery](https://docs.celeryq.dev/en/v5.2.7/) for task scheduling.

## Usage

Celery is used for
- Search results downloads with more than 10.000 documents
- The term frequency visualisation
- The wordcloud visualisation
- The ngram visualisation

## Running celery

See the repository readme for installation instructions. For development, it is possible to run I-analyzer without celery if you are not intending to use any of the functions listed above.

### Redis

Celery uses [redis](https://www.redis.io/) as a backend for task data. Start Redis by running `redis-server` in a terminal.

If you wish to run Redis from a non-default hostname and/or port, or pick which database to use, specify this in your `/backend/ianalyzer/config.py` as

```python
CELERY_BROKER_URL='redis://{host}:{port}/{db_number}'
CELERY_BACKEND='redis://{host}:{port}/{db_number}'
```

It is possible to configure your environment with a different celery backend, but not recommended.

### Celery worker

When your redis server is running, start a celery worker. Activate your python environment and navigate to the backend directory.

Run

```bash
celery -A ianalyzer.runcelery.celery_app worker --loglevel=info
```

### Flower

You can use [flower](https://flower.readthedocs.io/) to monitor your tasks and workers. To run flower, open a new terminal, activate your python environment, navigate to the backend and run

```bash
celery -A ianalyzer.runcelery.celery_ap flower
```

Then open `localhost:5555` in your browser to see the flower interface.

## Developing with celery

Some tips:

- We currently do not have a setup to write unit tests that use celery. Make sure that your underlying functions are properly tested, and the tasks themselves do not contain complicated logic.
- The arguments and outputs for celery tasks must be JSON-serialisable. For example, a task function can have a user ID string as an argument, but not a `User` object.
- Use `group` to run tasks in parallel and `chain` to run tasks in series.
- You can use flower (see above) for an overview of your celery tasks. Note that groups and chains are not tasks themselves, and will not show up as tasks on Flower.
