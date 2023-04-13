# Celery

The backend uses [celery](https://docs.celeryq.dev/en/v5.2.7/) for task scheduling.

## Usage

Celery is used for
- Search results downloads with more than 10.000 documents
- The term frequency visualisation
- The ngram visualisation

## Running celery

See the repository readme for installation instructions. For development, it is possible to run I-analyzer without celery if you are not intending to use any of the functions listed above.

### Redis

Celery uses [redis](https://www.redis.io/) as a backend for task data. Start Redis by running `redis-server` in a terminal.

If you wish to run Redis from a non-default hostname and/or port, or pick which database to use, specify this in your `/backend/ianalyzer/settings_local.py` as

```python
CELERY_BROKER_URL='redis://{host}:{port}/{db_number}'
CELERY_BACKEND='redis://{host}:{port}/{db_number}'
```

It is possible to configure your environment with a different celery backend or broker, but not recommended.

### Celery worker

When your redis server is running, start a celery worker. Activate your python environment and run:

```bash
cd backend
celery -A ianalyzer worker
```

or the shorthand:

```bash
yarn celery worker
```

### Flower

You can use [flower](https://flower.readthedocs.io/) to monitor your tasks and workers. To run flower, open a new terminal, activate your python environment and run

```bash
cd backend
celery -A ianalyzer flower
```

or

```bash
yarn celery flower
```

Then open `localhost:5555` in your browser to see the flower interface.

## Developing with celery

- The arguments and outputs for celery tasks must be JSON-serialisable. For example, a task function can have a user ID string as an argument, but not a `CustomUser` object.
- Use `group` to run tasks in parallel and `chain` to run tasks in series.
- You can use flower (see above) for an overview of your celery tasks. Note that groups and chains are not tasks themselves, and will not show up as tasks on Flower.
- For easier debugging and testing, keep your tasks simple and outfactor complicated functionality to 'normal' functions.

### Unit tests

See the [celery documentation on testing with pytest](https://docs.celeryq.dev/en/stable/userguide/testing.html#pytest).

The ultra-short version:
- If your code will start a celery task, you will need the `celery_worker` fixture.
- If an asynchronous process uses the database, the unit test should use the `transactional_db` fixture.
- If you want to test the output of a task function, you usually do not need parallel processing. Use `result = task.apply().get()` to run the task synchronously.
