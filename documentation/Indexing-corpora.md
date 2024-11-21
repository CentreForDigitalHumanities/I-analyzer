# Indexing corpora

Indexing is the step to read the source data of the corpus and load it into elasticsearch. Elasticsearch creates an *index* of the data, which makes it available for efficient searching and aggregations.

This step is necessary to make a dataset available in the I-analyzer interface. Note that indexing can take a significant amount of time (depending on the amount of data).

You can start indexing once you have:
- Created a definition for the corpus
- Run all migrations
- Started Elasticsearch
- If it is a Python corpus:
    - added necessary settings to your project, such as the source data directory.
    - imported the definition into the database. For Python corpora, run `yarn django loadcorpora` to do this.

The basic indexing command is:

```bash
yarn django index my-corpus
```

## Parameters

Use `yarn django index --help` to see all possible parameters. Some useful options are highlighted below.

### Development

For development environments, we usually maintain a single index per corpus, rather than creating versioned indices. New indices are also created with `number_of_replicas` set to 0 (this is to make index creation easier/lighter).

Some options that may be useful for development:

- `--delete` / `-d` deletes an existing index of this name, if there is one. Without this flag, the script will raise an error if the index already exists.
- `--start` / `-s` and `--end` / `-e` respectively give a start and end date to select source files. Note that this only works if the `sources` function in your corpus definition makes use of these options; not all corpora have this defined. (It is not always possible to infer dates from source file metadata without parsing the file.)

### Production

See [Indexing on server](documentation/Indexing-on-server.md) for more information about production-specific settings.

## IndexJob log

When you start the command, the application will save an `IndexJob` that represents the action. These can also be viewed in the admin site.

IndexJobs are not automatically deleted when the command completes, but can be freely deleted at that point.
