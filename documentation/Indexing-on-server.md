# Indexing corpora on the server

## Moving data to server
On the server, move data to a location in the `/its` share.

## Deployment settings
In the Deployment repository, set the variables of the corpus, with the `YOUR_CORPUS_DATA` variable set to the location on the `/its` share. Also add the corpus to the list of `CORPORA`, pointing to the correct location of the corpus definition on the server.

Change user to www-data (`sudo -iu www-data`), adjust branch and deploy changes with new corpus definition.

## Indexing
Start a screen with a descriptive name (e.g., `screen -S index-superb-corpus`). Go to the server's `data` directory, and run `source env/bin/activate`. Move to backend directory: `cd source/backend`

Call the flask command for indexing, e.g., `flask es -c superb-corpus -p`. The production flag indicates that we have a *versioned* index after this: `superb-corpus-1`. You can also choose to add the `--rollover` (`-r`) flag: this is equivalent with automaticaly calling `flask alias` after `flask es`. As it's advisable to double-check a new index before setting / rolling over the alias, this flag should be used with caution.

## Additional indexing flags
It is also possible to only add settings and mappings by providing the `--mappings-only` or `-m` flag. This is useful, for instance, before a `REINDEX` via Kibana from one Elasticsearch cluster to another (which is often faster than reindexing from source).

## Alias
Either:
- create an alias `superb-corpus` on Kibana manually:
`PUT suberb-corpus-1/_alias/superb-corpus`. After this, the corpus will be reachable under the alias.
- or: run `flask es alias -c superb-corpus-name`. This will set an alias with the name defined by `es_alias` or (fallback) `es_index`. If you additionally provide the `--clean` flag, this will also remove the index with the lower version number. Naturally, this should only be used if the new index version has the expected number of documents, fields, etc., and the old index version is fully dispensable.

## Indexing from multiple corpus definitions
If you have separate datasets for different parts of a corpus, you may combine them by setting the `ES_INDEX` variable in the corpus definitions to the same `overarching-corpus` index name.

Then, you can define multiple corpora in the deployment module, e.g.,
```
CORPORA = {
    'corpus1': 'path/to/corpus1',
    'corpus2': 'path/to/corpus2'
}
```

Then, `flask es -c corpus1 -p` will write to `overarching-corpus-1`. After this, you have to set the alias on Kibana (`PUT corpus1/_alias/overarching-corpus`). A consecutive `flask es -c corpus2 -p` will then write to `overarching-corpus-2`. The second indexing call will fail if you don't set the alias first. Also don't forget to set the alias for the second corpus (`PUT corpus2/_alias/overarching-corpus`).

After this, you can search both corpora via `overarching-corpus`. Note that you still need to decide which corpus definition controls what is visible to the user in the frontend. If the corpus definitions are very different on the `fields` level, it probably makes more sense to display two different corpus definitions to the user.

Be aware that the term frequency and ngram visualisations rely on term vector requests, which are rejected for an alias that has multiple indices connected to it. In other words, these visualisations will not work if you use this method. To prevent error messages in the interface, make sure to  **disable term frequency and ngram visualisations** if you are combining corpora this way.
