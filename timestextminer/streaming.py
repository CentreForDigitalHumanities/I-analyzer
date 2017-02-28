'''
Module handles such things as streaming CSV files from dictionary iterators.
'''

import csv
from datetime import datetime
from .corpora.common import Field


def field_lists(dictionaries, selected=None):
    '''
    Iterate through some dictionaries and yield for each dictionary the values
    of the selected fields, in given order.
    '''

    fields = [
        field.name if isinstance(field, Field) else str(field)
        for field in selected
    ]

    yield fields

    def _stringify(value):
        if value is None:
            return ''
        if isinstance(value, list):
            return ', '.join(value)
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%d')
        return str(value)

    if fields:
        for doc in dictionaries:
            yield [ _stringify(doc.get(field)) for field in fields ]



def as_csv(stream):
    '''
    Stream a CSV line-by-line when supplied with an iterator of its rows.
    '''

    class Line(object):
        '''
        Auxiliary class. Pretends to be a file object, which facilitates streaming
        CSV files; that is, it makes it possible to use the `csv` module while just
        iterating over the lines that that module writes.
        '''

        def __init__(self):
            self._line = None
        
        def write(self, line):
            self._line = line
        
        def read(self):
            return self._line

    line = Line()
    writer = csv.writer(line)
    for item in stream:
        writer.writerow(list(item))
        yield line.read()

# TODO stream multiple CSVs in a zip file?
