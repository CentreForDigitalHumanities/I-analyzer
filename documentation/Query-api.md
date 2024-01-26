# Query API

For the most part, searching works as follows.
- The user interacts with the frontend interface, and the frontend constructs a query JSON in the [elasticsearch query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html).
- The frontend makes a request to the backend with the query in the payload and the backend returns the result.

So as a minimal example, the frontend can send a POST request to `/api/es/example_corpus/_search` with the following payload.

```json
{
    "es_query": { "match_all": {} }
}
```

There are a few more things to keep in mind.

## Query parameters in URL

First, the request URL can also include extra query parameters, which will be merged into the elasticsearch query. So if the above request is made to `/api/es/example_corpus/_search?size=10`, the query forwarded to elasticsearch is

```json
{ "match_all": {}, "size": 10 }
```

## Tags

The query API also allows one additional parameter besides `es_query`, which is `tags`. This should give a list of IDs for tags that the query should be filtered on. The backend is reponsible for merging tags into the query. For example, this is a request for all documents with tag 42:

```json
{
    "es_query": {
        "match_all": {}
    },
    "tags": [42],
}
```

