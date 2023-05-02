from datetime import datetime
import os
from django.conf import settings
from addcorpus.corpus import XMLCorpus, Field
from addcorpus.extract import Metadata, XML

class DBNL(XMLCorpus):
    title = 'DBNL'
    description = 'Digitale Bibliotheek voor de Nederlandse letteren'
    data_directory = settings.DBNL_DATA
    min_date = datetime(year=1200, month=1, day=1)
    max_date = datetime(year=2020, month=12, day=31)
    es_index = getattr(settings, 'DBNL_ES_INDEX', 'dbnl')
    image = 'dbnl-logo.jpeg'

    tag_toplevel = 'TEI.2'
    tag_entry = 'text'

    def sources(self, start = None, end = None):
        for filename in os.listdir(self.data_directory):
            id, *_ = filename.split('_')
            metadata = {'id': id}
            yield os.path.join(self.data_directory, filename), metadata

    title_id = Field(
        name='title_id',
        display_name='Title ID',
        display_type='text',
        description='ID of the work',
        extractor = Metadata('id')
    )

    fields = [
        title_id,
    ]
