### Download a CSV of search results
By clicking the "Download CSV" button, you can download a table of your search results.

Next to the "Download CSV" button, the "Settings" button (gear icon) allows you to specify which fields should be downloaded. Some fields are shown by default, others can be displayed by clicking the "Load more" button.

### Download visualization data as CSV
When you display the the numbers underlying a visualization (by clicking the "table" icon in the top right corner), you can download this table. For this, click on the download icon at the lower side of the table, next to the pagination buttons.

### Processing CSV files further in other software
The csv files are delimited by `;` - this means that Microsoft Excel will be able to parse the columns. In other Office programs, you can usually set the delimiter when you import a csv.

If you process the csv further in R or Python, you can specify the delimiter which should be used.
For example, in R:
```
data <- read.csv('corpus/your-query.csv', sep=';')
```

In Python Pandas:
```
import pandas as pd
data = pd.read_csv('corpus/your-query.csv', sep=';')
```
