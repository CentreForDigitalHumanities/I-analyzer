# Indexing corpora

Indexing is the step to read the source data of the corpus and load it into elasticsearch, which makes the data available through the I-analyzer interface.

You can start indexing once you have:
- Created a definition for the corpus
- If it is a Python corpus: added necessary settings to your project, such as the source data directory.
- Imported the definition into the database. For Python corpora, run `yarn django loadcorpora` to do this.

The basic indexing command is:

```bash
yarn django index my-corpus
```

Use `yarn django index --help` to see all possible flags. Some useful options are highlighted below.

## Development

For development environments, we usually maintain a single index per corpus, rather than creating versioned indices. New indices are also created with `number_of_replicas` set to 0 (this is to make index creation easier/lighter).

Some options that may be useful for development:

### Delete index before starting

`--delete` / `-d` deletes an existing index of this name, if there is one. Without this flag, you will add your data to the existing index.

### Date selection

`--start` / `-s` and `--end` / `-e` respectively give a start and end date to select source files. Note that this only works if the `sources` function in your corpus definition makes use of these options; not all corpora have this defined. (It is not always possible to infer dates from source file metadata without parsing the file.)

## Production

See [Indexing on server](documentation/Indexing-on-server.md) for more information about production-specific settings.
