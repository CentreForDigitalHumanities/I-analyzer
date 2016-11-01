import csv
from .sources.common import Field

class Line(object):
    '''
    Auxiliary, for streaming CSV.
    '''

    def __init__(self):    self._line = None
    def write(self, line): self._line = line
    def read(self):        return self._line


def generate_csv(documents, select=None, include_score=True):
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
        writer.writerow(
            ','.join(value) if isinstance(value, list) else str(value)
            for value in values
        )
        yield line.read()
