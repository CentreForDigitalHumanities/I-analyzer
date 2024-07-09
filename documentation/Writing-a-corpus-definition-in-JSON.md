# Writing a corpus definition in JSON

Database-only corpora support a JSON format for creating corpus definitions. This format is implemented in the backend API of I-analyzer. Like Python definitions, a JSON definition can be used to store and share a configuration for a corpus.

The format is defined in [corpus.schema.json](/backend/addcorpus/schemas/corpus.schema.json).

## Importing and exporting definitions

You can import and export JSON definitions through the frontend. Visit `/corpus-definitions/` to do so.

Some notes on importing and exporting JSON definitions:

- A JSON definition is less detailed than the database model. This is because the database model must also support Python corpora (which offer more customisation) and legacy options. If you edit a corpus through the admin, exporting it to JSON and importing it again may include some normalisation.
- Some properties of the corpus are not handled through the JSON interface, though they are supported in database-only corpora. Currently, these can only be configured in the admin. These are the corpus image, documentation pages, and data directory.
