This directory defines corpora for parliamentary speeches, made for the People & Parliament project. Each country has its own corpus, but the corpora share the same structure and formatting wherever possible. This readme is intended to record any conventions we arrived at in the project.

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
- Set the corpus date range if needed. See below.
- Define the index name and data directory from config.
- Add an (open license) image of the parliament in `./images/`.
- Define `es_settings` property. Import `PP_ES_SETTINGS` from config, and add language-specific analyzers. Include an analyzer `stopwords` and `stemmer`.
- Check which of the fields in `field_defaults.py` contain information that is present in your source files. For each, make a new instance using the default function. Define the extractor. If needed, you can override other properties. Do not override `name` or `display_name`. See below for more documentation on specific fields.
- If your source files contain relevant information that is not an existing field, add it in `field_defaults.py`, leaving out the extractor. Then define it in your class as desired. Make sure to add proper documentation for your field.
- Define the `fields` property in `__init__(self)`.

### Corpus titles

The title of each corpus should be `People & Parliament ({country})`. If there are separate corpora for different time periods, as in the German data, include the time range in the title: `People & Parliament ({country} - {time range})`

The subtitle provides some context for the project and states the houses of parliament. In a biparliamentary system, it should be `Speeches from the {senate} and {house of commons}`, where you substitute these terms with the names of the corresponding houses in the source language. In a uniparliamentary system, or in cases where we only have data from one house, the subtitle is `Speeches from the {house}`.

### Date range

By default, corpora use the date range specified in [constants](./utils/constants.py). The dates in that file should provide the lower and upper bound for _all_ parliament corpora.

If the time range of your data is notably more narrow than the default values, specify the `min_date` and/or `max_date` of your corpus. (Make sure to adapt the date filter as well, see below in the list of fields.)

If the time range is wider, change the dates in the constants file accordingly. Note that this will widen the range for _all_ corpora, so you will probably need to specify more narrow date ranges for corpora that use the default values.

## Fields

A shared list of field definitions is provided in [field_defaults.py](./utils/field_defaults.py)

### Country

Country of the corpus in English.

### Date

Date of the speech in `yyyy-MM-dd` format. If your corpus uses a different `min_date` and `max-date` from the default values, set `date.search_filter.upper` and or `date.search_filter_lower` accordingly.

### Date is estimate

Whether the provided date is an estimate. You only need to include this if it is occasionally `True` within that country's corpus.


### Earliest date, Latest date

If the dataset does not include exact dates, these specify the earliest and latest date for the speech.

### House

House of parliament where the debate took place. Use the source language ("Eerste Kamer" rather than "senate") and title case.

If the corpus includes extraparliamentary debates, specify them as `"Other"`.

If there is only one house in the dataset, include this field with a `Constant` extractor, so it is clear to the user what house speeches belong to. Clear the search filter and visualisation properties in that case.

### Debate title

Title of the debate in the source language. Use title case. Remove leading or trailing punctuation.

"Debate" is generally synomymous with "session".

### Debate ID, speech ID, speaker ID, party ID

Various unique IDs. The uniqueless is on the level of the country corpus.

Speech ID will be used as the index of the document in elasticsearch, so it is not optional.

A debate ID is not technically required, but useful for finding speeches from the same session. If the data does not provide debate IDs, you can generate one from the date (and house, if there is more than one).

### Topic, subtopic

If debates are divided into topics, you can add them in these fields. If there are more than 2 layers (subtopics being divided into sub-subtopics), stack them all in Subtopic, separated by a dash (`–`).

### Speaker

The speaker's full name. The formatting is often limited by the source data. Here is a loose order of preference:

1. First and last name (John Doe)
2. Title, first name, last name (Mr John Doe)
3. Title and/or initial, last name (Mr J. Doe, J. Doe, Mr Doe)
4. Last name (Doe)
5. Title (The prime minister, The honorable gentleman)

Titles are often contextual, and may change over a person's career. Therefore, it is preferred to leave out the title _if_ the data provides speakers' full names. If it is not so specific, just include any information available.

The speaker name can be searched as a text field, so don't worry too much about including "reduntant" words.

Some datasets occasionally include trailing punctuation (typically `:`), which should be filtered out.

### Speaker birth year, birth place, birth country, death year, gender, profession, aristocracy, and academic title

Various pieces of background information about a speaker. Can be added if it is present in the source data. These are not particulary important to the people and parliament project, so cleanup/processing is not worh our time.

### Role, role long

The role of the speaker in the debate, like MP, Speaker, Government, etc.

"Role long" provides an expanded description, which cannot be used for filtering or visualisation.

### Party, party full

"Party" should give the commonly used name for the party. This is the primary party field; `party_id` and `party_full` provide extra information. It is presented as a search filter and visualisation.

As many party names are abbreviations, the field `party full` may be included to give the unabbreviated party name.

### Page, column, book label, book id

These all refer to the original source document and the location of the speech therein. Add them where they are provided.

For pages or columns, it is preferred that they are formatted as `{page}` or `{min page}-{max page}`.

If you have a page range for a larger section that contains the speech, but not the speech itself, you can add this as the page range.

### url

If provided, a url where the user can find the source document.

If the dataset includes more than one type of url (e.g. both a PDF and HTML file) and they are not mutually exclusive, add multiple fields based on the `url()` base field. Adjust the display names and descriptions to specify the file type. You will need to adjust the name of the fields in the index as well. For consistency with other corpora, let one field keep the `url` name, and name other fields `url_{subtype}`, e.g. `url` and `url_html`. See the France corpus for an example.

### Sequence

This indicates the order of debates within a speech. To view a debate in order, the user can filter a particular debate, and then sort by sequence.

Since their primary purpose is sorting, it is fine if the sequence skips numbers.

If the unit of your documents is pages in books rather than speeches, you may still use this field but adjust the description.
