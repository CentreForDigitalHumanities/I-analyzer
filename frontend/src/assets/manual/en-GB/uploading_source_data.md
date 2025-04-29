When you create a corpus, you will need to upload your source data as a CSV file.

## Technical specification

Each data file must be a CSV file. You should save the file as `*.csv`.

These are the requirements for the format of the data:

- You can use a comma (`,`), semicolon (`;`) or tab as a separator between columns. (Any is fine, but you cannot mix different separators in your data.)
- The first row of the file should be the header; it contains the column names.
- The file encoding should be `uft-8`.

In addition, the table below describes formatting requirements per data type.

| Data type | Notes |
|-----------|-------|
| text      | To avoid problems when the text contains the separator character, put the text between double quotes (`"`). (You can use quotes for other fields types, as well, but it is not necessary.) If the text field may contain line breaks and/or quote characters, put the text between three quotes (`"""`). |
| date      | Should be formatted as *year-month-day*. For example, "March 18th, 1927" can be written as `1927-3-18` or `1927-03-18`. |
| number (integer) | - |
| number (decimal) | Use a demical point (`.`), not a comma (`,`). |
| boolean   | Write values as `true` or `false` (case-insensitive) |

### Example

Below is an example of a valid CSV file.

```csv
date,genre,pages,rating,female_author,title,content
1818-01-01,"Science fiction",150,3.9,true,"Frankenstein, or, the Modern Prometheus","""You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings."""
1813-01-28,"Romance",334,4.1,true,"Pride and Prejudice","""It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife."""
1865-11-09,"Children",false,239,4.0,false,"Alice's adventures in Wonderland / Through the Looking Glass","""Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do."""
```

This file contains the following columns: `date` (date), `genre` (text), `pages` (number, integer), `rating` (number, decimal), `female_author`, (boolean), `title` (text), `content` (text).
