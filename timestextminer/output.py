import csv

class Line(object):
    '''
    Auxiliary, for streaming CSV.
    '''

    def __init__(self):    self._line = None
    def write(self, line): self._line = line
    def read(self):        return self._line


def generate_csv(documents, select=None, include_score=True):
    '''
    Generate a CSV file from the documents dictionary returned by
    ElasticSearch, selecting only those fields referenced in the iterator.
    '''

    fields = list(
        field if isinstance(field, str) else field.name for field in select
    )

    if include_score:
        fields.append('score')

    line = Line()
    writer = csv.writer(line)
    writer.writerow(fields)
    yield line.read()

    for doc in documents:
        writer.writerow(doc.get(field) for field in fields)
        yield line.read()
