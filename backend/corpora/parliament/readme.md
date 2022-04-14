This directory defines corpora for parliamentary speeches, made for the People & Parliament project. Each country has its own corpus, but the corpora should the same structure and formatting wherever possible. This readme is intended to record any conventions we arrived at in the project.

## Directory setup

The file [parliament.py](./parliament.py) defines a class `Parliament` which is a parent class for all other parliamentary corpora. It defines some class properties that should be shared. It also contains definitions for the fields `speech`, `date`, and `country`, which may be used for cross-corpus search.

Each country has a python file with the corpus definition (e.g. [netherlands.py](./netherlands.py)). In some cases, additional python files are used, typically to include source files from multiple time frames (e.g. [netherlands_recent.py](./netherlands_recent.py)).

The `utils` directory contains some common functionality between parliament classes:
- [constants.py](./utils/constants.py) defines constants (🙃), currently just the minimum and maximum date for documents.
- [field_defaults.py](./utils/field_defaults.py) contains the basic field definitions. For each field `foo` used in any of the parliament corpora, this file should contain a function `foo()` that returns a new instance of a `Field` object. This instance defines "default" properties of the field, which may be overwritten by parliament classes. It does not include an extractor, as that is dependent on each corpus.
- [formatting.py](./utils/formatting.py) contains any functions useful for formatting values. The file is mostly intended for functions that are shared between several corpora. Corpus files often contain their own formatting functions as well, which usually serve to iron out idiosyncracies of the source files.

The `tests` directory defines tests for corpus definitions. Each country should have a test that checks the output of `documents()` for an example source file. Setup for tests is defined in [conftest.py](./conftest.py).

The `images` directory contains the images used in the corpus overview.

## Adding a corpus

- Make a corpus class. It should be a child class of `Parliament` and the corpus class for your type of source file, i.e. `CSVCorpus`, `XMLCorpus`, etc.
- Define the title and description. See below.
- If the time range of your data is notably more narrow than the `min_date` and `max_date` in [constants](./utils/constants.py), specify the `min_date` and/or `max_date` of your corpus. If the time range is wider, change the dates in the constants file.
- Define the index name and data directory from config.
- Add an (open license) image of the parliament in `./images/`.
- Define `es_settings` property. Import `PP_ES_SETTINGS` from config, and add language-specific analyzers. Include an analyzer `stopwords` and `stemmer`.
- Check which of the fields in `field_defaults.py` contain information that is present in your source files. For each, make a new instance using the default function. Define the extractor. If needed, you can overwrite other properties. Do not overwrite `name` or `display_name`. See below for more documentation on specific fields.
- If your source files contain relevant information that is not an existing field, add it in `field_defaults.py`, leaving out the extractor. Then define it in your class as desired. Make sure to add proper documentation for your field.
- Define the `fields` property in `__init__(self)`.

### Corpus titles

The title of each corpus should be `People & Parliament ({country})`. If there are separate corpora for different time periods, as in the German data, include the time range in the title: `People & Parliament ({country} - {time range})`

The subtitle provides some context for the project and states the houses of parliament. In a biparliamentary system, it should be `Speeches from the {house of commons} and {senate}`, where you substitute these terms with the names of the corresponding houses in the source language. In a uniparliamentary system, or in cases where we only have data from one house, the subtitle is `Speeches from the {house}`.

## Fields

A shared list of field definitions is provided in [field_defaults.py](./utils/field_defaults.py)

### Country

Country of the corpus in English.

### Date

Date of the speech in `yyyy-MM-dd` format. If your corpus uses a different `min_date` and `max-date` from the default values, set `date.search_filter.upper` and or `date.search_filter_lower` accordingly.

### Date is estimate

Whether the provided date is an estimate. You only need to include this if it is occasionally `True` within that country's corpus.

### House

House of parliament where the debate took place. Use the source language ("Eerste Kamer" rather than "senate") and title case.

You may want to include an `"Other"` option for extraparliamentary debates.

If there is only one house in the dataset, include this field with a `Constant` extractor, so it is clear to the user what house speeches belong to. Delete the search filter and visualisation properties in that case.

### Debate title

Title of the debate in the source language. Use title case. Remove leading or trailing punctuation.

Debate is generally synomymous with session.

### Debate ID, speech ID, speaker ID, party ID

Various unique IDs. The uniqueless is on the level of the country corpus.

Speech ID will be used as the index of the document in elasticsearch, so it is not optional.

### Topic, subtopic

If debates are divided into topics, you can add them in these fields. If there are more than 2 layers (subtopics being divided into sub-subtopics), stack them all in Subtopic, separated by a dash (`–`).

### Speaker

The speaker's full name. The formatting is often limited by the source data. Here is a loose order of preference:

1. First and last name (John Doe)
2. Title, first name, last name (Mr John Doe)
3. Title and/or initial, last name (Mr J. Doe, J. Doe, Mr Doe)
4. Last name (Doe)
5. Title (The prime minister, The honorable gentleman)

The speaker name can be searched as a text field, so don't worry too much about including "reduntant" words.

Some datasets occasionally include trailing punctuation (typically `:`), which should be filtered out.

### Speaker birth year, birth place,  death year, death place, gender, profession, aristocracy, and academic title

Various pieces of background information about a speaker. Can be added if it is present in the source data.

Gender, aristocracy and academic title might be inferred form the speaker's title if they are not included explicitly. Given the interests of the People & Parliament project, this does not seem worth our time, however.

### Role, role long

The role of the speaker in the debate, like MP, Speaker, Government, etc.

### Party, party full

Party is the commonly used name for the party. This is the primary party field; `party_id` and `party_full` provide extra information. It is presented as a search filter and visualisation.

As many party names are abbreviations, the field `party full` may provide the unabbreviated party name.

### Page, column, book label, book id, source url

These all refer to the original source document and the location of the speech therein. Add them where they are provided.

For pages or columns, it is preferred that they are formatted as `{page}` or `{min page}-{max page}`.

If you have a page range for a larger section but not for the specific speech, you can add this as the page range: it's better than nothing.

### Sequence

This indicates the order of debates within a speech. To view a debate in order, the speaker can filter a particular debate, and then sort by sequence. 

Since their primary purpose is sorting, it is fine if the sequence skips numbers.
