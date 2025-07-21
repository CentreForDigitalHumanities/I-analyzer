### Download a CSV of search results
By clicking the "Download" tab, you can download a table of your search results.

This will bring up a dialog, which shows how many results are currently selected. Note that downloading more than 1000 results at a time will require that you register, so the results can be sent per email.

To adjust the columns that will appear in the csv file, you can select which *Fields* to download below. The options are all the fields of the corpus you are downloading from, with an addition of the following two fields:
- Your tags: will download your personal tags of the documents
- Document link: will download the unique link of each document for future reference

By default, a number of fields - usually a full-text field, an identifier and the date of the document - are selected for download. Note that for convenience, the query that was used to filter the results of the `.csv` will be included in the resulting file as an extra column.

You can also choose to apply different sorting to the documents that will be downloaded, and choose the encoding of the reulsitng `.csv` file.

### Download visualization data as CSV
When you display the the numbers underlying a visualization (by clicking the "table" icon in the top right corner), you can download this table. For this, click on the download icon at the lower side of the table, next to the pagination buttons.

#### Full data
When visualisations are based on a sample of the search results, you may have the option to request the full data. At the moment, this only supported for the term frequency graph. (For more information on sampling, check the documentation of each visualisation type.)

This option allows you to download a CSV table of the result based on all documents in your search results, instead of a sample. Since the analysis for these tables may take some time, you will receive an email with a download link when the result is ready.

### Processing CSV files further in other software
You can import csv files in a spreadsheet program like Microsoft excel. The csv files for search results are delimited by `;`. If the columns are not imported correctly, you may need to set the delimiter. (The csv files for visualisations are delimited by `,` and should be imported correctly by default.)

If you process the csv further in R or Python, you can specify the delimiter which should be used.
For example, in R:
```
data <- read.csv('corpus/your-search-results.csv', sep=';')
data <- read.csv('corpus/your-visualisation.csv')
```

In Python [Pandas](https://pandas.pydata.org/) (note that this requires that you have pandas installed).
```
import pandas as pd
data = pd.read_csv('corpus/your-search-results.csv', sep=';')
data = pd.read_csv('corpus/your-visualisation.csv')
```
