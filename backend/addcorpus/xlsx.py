import logging
import openpyxl
from openpyxl.worksheet.worksheet import Worksheet

from addcorpus.corpus import CorpusDefinition
from addcorpus import extract

logger = logging.getLogger('indexing')

class XLSXCorpusDefinition(CorpusDefinition):
    '''
    Parent class for corpora that extract data from excel spreadsheets
    '''

    '''
    If applicable, the field that identifies entries. Subsequent rows with the same
    value for this field are treated as a single document. If left blank, each row
    is treated as a document.
    '''
    field_entry = None

    '''
    Specifies a required field, for example the main content. Rows with
    an empty value for `required_field` will be skipped.
    '''
    required_field = None

    '''
    Number of lines to skip before reading the header
    '''
    skip_lines = 0

    def source2dicts(self, source):
        # make sure the field size is as big as the system permits
        self._reject_extractors(extract.XML, extract.FilterAttribute)

        if isinstance(source, str):
            filename = source
            metadata = {}
        elif isinstance(source, bytes):
            raise NotImplementedError()
        else:
            filename, metadata = source

        wb = openpyxl.load_workbook(filename)
        logger.info('Reading XLSX file {}...'.format(filename))

        sheets = wb.sheetnames
        sheet = wb[sheets[0]]
        return self._sheet2dicts(sheet, metadata)

    def _sheet2dicts(self, sheet: Worksheet, metadata):
        data = (row for row in sheet.values)

        for _ in range(self.skip_lines):
            next(data)

        header = list(next(data))

        index = 0
        document_id = None
        rows = []

        for row in data:
            values = {
                col: value
                for col, value in zip(header, row)
            }

            if self.required_field and not values.get(self.required_field):  # skip row if required_field is empty
                continue

            identifier = values.get(self.field_entry, None)
            is_new_document = identifier == None or identifier != document_id
            document_id = identifier

            if is_new_document and rows:
                yield self.document_from_rows(rows, metadata, index)
                rows = [values]
                index += 1
            else:
                rows.append(values)

        if rows:
            yield self.document_from_rows(rows, metadata, index)

    def document_from_rows(self, rows, metadata, row_index):
        doc = {
            field.name: field.extractor.apply(
                rows=rows, metadata = metadata, index=row_index
            )
            for field in self.fields if field.indexed
        }

        return doc
