# Visualisation cache

The backend has the function to store results of visualisations in the database, which can save processing time on visualisations.

The cache is currently used for the term frequency, ngram and wordcloud graphs. It is not used for related words or document count, since those visualisations don't have long loading times.

## Configuration

The cache will only be used if it is enabled in the config:

```python
USE_VISUALIZATION_CACHE = True
```

Setting this value to `False` temporarily will not clear the cache, but it will not be utilised.

It is recommended to disable caching in a development environment.

## Clearing the cache

Cached results do not update when you change the code for a visualisation or the data for a corpus. As such, it may be necessary to clear the cache after updates.

You can clear the visualisation cache with the following command from `/backend`:

```bash
flask clearcache --corpus times --type termfrequency
```

The `corpus` and `type` flags are both optional, and can be used to delete the cache of a specific visualisation type and/or corpus.
