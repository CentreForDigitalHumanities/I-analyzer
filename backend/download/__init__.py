import csv

SEARCH_RESULTS_DIALECT = {
    'delimiter': ';',
    'quotechar': '"',
    'quoting': csv.QUOTE_NONNUMERIC,
    'skipinitialspace': True,
}

csv.register_dialect('resultsDialect', **SEARCH_RESULTS_DIALECT)

