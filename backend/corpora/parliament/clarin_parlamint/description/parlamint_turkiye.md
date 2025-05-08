# Corpus of parliamentary debates ParlaMint-TR

- Country: TR (Turkey)
- Language tr (Turkish)
- Version: 4.1
- Handle: [http://hdl.handle.net/11356/1912](http://hdl.handle.net/11356/1912)


## Documentation

### Parlamint Project
ParlaMint, a CLARIN flagship project, resulted in the creation of comparable corpora of parliamentary debates of 29 European countries and autonomous regions, covering at least the period from 2015 to 2022, and containing over 1 billion words. The corpora are uniformly encoded, contain rich metadata about their 24 thousand speakers, and are linguistically annotated up to the level of Universal Dependencies syntax and named entities.

### Characteristics of the national parliament

The current parliamentary system in Turkey is a unicameral system (there have been periods of bicameral systems in the past). The political system is a multi-party system. There are no official “political groups”, however, since 2018 parties make alliances during elections, which may affect their relations in the parliament as well. The current version of the corpus contains transcripts of debates in the last four terms (from 24 to 27) of the Grand National Assembly of Turkey (Turkish: Türkiye Büyük Millet Meclisi), which is approximately 50 million words recorded in  1341 sessions from June 2011 to December 2022.

### Data source and acquisition

The data is scraped from the official web page of the parliament (https://www.tbmm.gov.tr/). The transcripts for this period are published as HTML documents. The data is downloaded using GNU wget, and extracted from the HTML files using Beautiful Soup, and lxml libraries (Python). Except for the default processing built into these libraries (for encoding correction, HTML cleanup), no other preprocessing was applied.

### Corpus-specific metadata

Current version of the corpus contains the sex, the date/place of birth, and when available Wikipedia, Wikidata and Twitter linksfor regular speakers. The corpus also encodes the constituencies of the parliament members. Changes to party affiliations are documented during the time period of the corpus. Otherwise, the start of party affiliation is left unspecified.
