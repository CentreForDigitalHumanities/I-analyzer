When you add fields to your corpus, you have to specify the type of data they contain. When you upload your sample data, I-analyzer try to figure out the type from your data file. You should check that the pre-selected type is what you expect.

Below is a list of all possible data types for a corpus.

## Text (content)

A text content field contains a longer piece of text, such as the content of a newspaper article, the text of an online review, etc. Because I-analyzer is first and foremost a text searching tool, every corpus must have at least one text content field.

Users will be able to search  through the field, but the field will not have a filter option.


## Text (metadata)

A text metadata field contains a shorter piece of text, such as its title, author, or an ID.

When you open a document, text metadata fields are displayed in the metadata table on the left.

You can choose whether users will be able to search through the field. This makes sense if the field contains text (such as a title) or names.

You can enable sorting on text metadata fields. Values in the field will be sorted in (forward or reverse) alphabetical order.

> **Tip**
>
> Sometimes, it's better to disable search for a field, because it leads to irrelevant results. For example, if you search for "new york" in a corpus of newspaper articles, do you want to see every single article from the *New York Times*?

Text metadata fields can be included as filters. The filter widget will be a dropdown with all values for the field.

## Number (integer)

An integer field contains whole numbers, like `1`, `47`, or `-300`. Examples are a publication year, a page number, or the number of stars in a review.

Number fields cannot be searched, but they can be included as filters. The filter widget will be a slider, where the user can select a range of values.

You can enable sorting on a number field. Values will be sorted from low to high, or high to low.

> **Tip**
>
> In some cases, a field contains numbers but a range slider does not make sense; for example, a ZIP code or a phone number. You can set the type to "text (metadata)", meaning this should just be treated as a string of characters.

## Number (decimal)

A decimal number field contains fractional numbers, like `1.5`. If a field contains both whole numbers and decimal numbers, it should be a decimal number field.

Like with integer fields, you can enable filtering and sorting for decimal fields.


## Date

A date field contains calendar dates.

If you include a date field as a filter, users will be able to pick the date in a calendar popup.

You can enable sorting on a date field. Values will be sorted in (forward or reverse) chronological order.


### BCE dates

I-analyzer does not support negative years in date fields. If you want to add information about BCE dates, we recommend that you create a "year" field that lists the year as a (possibly negative) number, which will enable users to filter on year ranges. You can add an additional text field to show the full date.

## Boolean

A boolean field contains true/false values.

You can enable filtering on boolean fields. The filter widget will show a checkbox.
