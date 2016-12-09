import csv
import logging; logger = logging.getLogger(__name__)

from datetime import datetime
from .corpora.common import Field

class Line(object):
    '''
    Auxiliary, for streaming CSV.
    '''

    def __init__(self):    self._line = None
    def write(self, line): self._line = line
    def read(self):        return self._line



def _stringify(value):
    if value is None:
        return ''
    if isinstance(value, list):
        return ', '.join(value)
    if isinstance(value, datetime):
        return value.strftime('%Y-%m-%d')
    return str(value)
    
    

def as_csv_stream(documents, select=None, include_score=True):
    '''
    Generate a CSV file from an iterator of document dictionaries; selecting
    only those fields referenced in the `select` iterator.
    '''

    fields = list(
        field.name if isinstance(field, Field) else
        str(field) for field in select
    )

    if include_score:
        fields.append('score')

    line = Line()
    writer = csv.writer(line)
    writer.writerow(fields)
    yield line.read()

    for doc in documents:
        values = (doc.get(field) for field in fields)
        writer.writerow([
            _stringify(value) for value in values
        ])
        yield line.read()



def as_list(documents, select=None, include_score=True):

    fields = list(
        field.name if isinstance(field, Field) else
        str(field) for field in select
    )

    if include_score:
        fields.append('score')

    result = [
        [ doc.get(field) for field in fields ]
    ]
    for doc in documents:
         result.append([_stringify(doc.get(field)) for field in fields])
    
    return result
