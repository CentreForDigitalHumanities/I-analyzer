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

## Scheduling and managing index jobs

When you run `index my-corpus`, the index process will start immediately. This process will store an `IndexJob` in the database that represents the action, which you may use as a log. You can use `yarn django indexjob list` to view an overview of all indexjobs, and `yarn django indexjob show {id}` to view details about a specific job. You can also view index jobs on the admin site.

If you want to create a job to run later, you can use `--create-only` in the index command. After this, you can start the job from the command line using `yarn django indexjob start {id}`. Alternatively, you can select the job in the admin site and use the action "start selected jobs". This will run the job asynchronously using celery.

You can also use the admin site to create or edit index jobs (and then run them). However, the command line is typically faster and easier.
