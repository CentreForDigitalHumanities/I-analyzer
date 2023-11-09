from addcorpus.corpus import FieldDefinition
from addcorpus.extract import Constant

from corpora.utils import exclude_fields

def test_exclude_fields():
    fields = [
        FieldDefinition(
            name='test1',
            extractor=Constant('some value')
        ),
        FieldDefinition(
            name='test2'
        )
    ]
    new_fields = exclude_fields.exclude_fields_without_extractor(fields)
    assert new_fields != fields
