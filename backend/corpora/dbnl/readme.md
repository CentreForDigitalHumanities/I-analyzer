# DBNL Corpus

## Data

The public domain can be downloaded from the [DBNL interface](https://www.dbnl.org/letterkunde/pd/index.php). You will need the .csv metadata file, and the XML files.

Your source directory should consist of the following:
- `'titels_pd.csv'`: the metadata file
- `xml_pd`: a directory that contains all the (unzipped) XML files.

If you want to use a sample for development, you can include fewer XML files. Any metadata not found as XML will still be added as a metadata-only records, but this is much faster than parsing and indexing the content.
