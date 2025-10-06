# Corpus validation

Corpus objects are validated in the database when they are saved. However, not every requirement for a working corpus can be mandated when it is intially created.

A corpus has two additional checks for different stages of its creation: _ready to index_ and _ready to publish_. More details on each of these below.

## Ready to index

A corpus that does not meet this check cannot be indexed in Elasticsearch. This can mean that it's missing essential fields, has no source data directory configured, etc.

A corpus must pass this check when you use the `index` command.

## Ready to publish

A corpus that does not meet this check cannot be searched in the frontend. This usually means the interface configuration is incomplete or invalid.

A corpus must pass this check to be set to `active` - which enables the corpus in the search interface.

The `ready_to_publish` validation is not executed when handling views, because it can include some non-trivial checks. Instead, we check whether `active` is `True`, which implies that the corpus passed this validation.

For Python corpora, `active` is automatically set by running `ready_to_publish()` after importing the corpus definition. Database-only corpora are inactive by default, and have to be activated manually, which will trigger the validation.

## API

These checks are available as methods on a `Corpus` object. The corpus has two methods for this: `corpus.validate_ready_to_index()` and `corpus.validate_ready_to_publish()`. These methods return no value but raise errors if they run into problems.

In addition, the following methods wrap these validation functions in a try/except block and return a boolean value: `corpus.ready_to_index()` and `corpus.ready_to_publish()`.

The first two methods are useful if you want feedback, the latter two methods are useful if you just need a binary state.
