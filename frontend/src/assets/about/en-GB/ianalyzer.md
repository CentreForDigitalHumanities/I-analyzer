## What is I-analyzer?

I-analyzer is a tool for exploring corpora (large collections of texts). You can use I-analyzer to find relevant documents, or to make visualisations to understand broader trends in the corpus. The interface is designed to be accessible for users of all skill levels.

I-analyzer is primarily intended for academic research and higher education. We focus on data that is relevant for the humanities, but we are open to datasets that are relevant for other fields.

## Development

I-analyzer is developed at Utrecht University's Centre for Digital Humanities by the Research Software Lab. The lab started development on I-analyzer in 2017. Searching through text data is the first step for a lot of humanities research, and I-analyzer is our way of adressing similar needs from researchers.

In its source code, I-analyzer separates the interface from the data structure of each corpus. For each new corpus that we add, we add a definition file that describes which fields exist, what kind of data each field contains, etc. The application then uses that information to present a search interface with filters, visualisations, et cetera.

This way, whenever researchers have data that they want to add, we don't need to describe what it means to filter or how the visualisations should work; we just need to define what the data looks like.

As I-analyzer is designed to be flexible, we have worked with different research projects over time to add corpora and develop the application. You can find more information about some of these projects in our [portfolio](https://cdh.uu.nl/portfolio/?_theme=i-analyzer).

The source code of I-analyzer is not publicly available at the moment, but we intend to make the application open-source in 2023.

## Research using I-analyzer

Below are some publications about I-analyzer corpora.

- Ortal-Paz Saar (2021). [PEACE: The portal on Jewish funerary culture](https://www.morressier.com/o/event/5fd2237e54bbb7f516f76f1b/article/5fd8d8c83d762219be34f4fb)
- Haidee Kotze, Berit Janssen, Corina Koolen, Luka van der Plas, & Gys-Walt van Egdom (2021). [Norms, affect and evaluation in the reception of literary translations in multilingual online reading communities: Deriving cognitive-evaluative templates from big data](https://www.jbe-platform.com/content/journals/10.1075/tcb.00060.kot)
- Pasi Ihalainen, Berit Janssen, Jani Marjanen, & Ville Vaara (2022). [Building and testing a comparative interface on Northwest European historical parliamentary debates : Relative term frequency analysis of British representative democracy](http://ceur-ws.org/Vol-3133/paper04.pdf)

If you used I-analyzer in your research and would like to be included in this list, please get in touch!

## Can I add my data to I-analyzer?

We are always interested in helping researchers by adding new text corpora! If you have some data that you want to add, get in touch and we will discuss the possibilities.

However, be aware that not all data is suitable to be added to I-analyzer. We may have to decline adding your data if...

- Your data is not available in a machine-friendly format. Machine-friendly formats include an archive of CSV, XML or JSON files, or an API. Machine-unfriendly formats include an archive of PDF files, scanned images that have not been processed into text, or a web interface without an API.
- Your data contains sensitive information, such as personal data or copyrighted material that cannot be shared with other researchers.
- Your data cannot be structured into small documents for handy searching.
- Adding your data would require a significant time investment on our behalf, and you do not have available funds or an affiliation with the humanities faculty of Utrecht University.
- Your data does not contain natural language.
- Your purpose with the data is not academic research or education, and the data does not have broader academic value.

Do you think that some of these may apply to you? We are still interested in hearing from you! There may be solutions to these issues; just be aware that I-analyzer may not be the tool you are looking for.

## Contact

For questions, suggestions, or adding new data: contact us via [cdh@uu.nl](mailto:cdh@uu.nl)
