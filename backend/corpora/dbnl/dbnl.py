from datetime import datetime
import os
from django.conf import settings
from addcorpus.corpus import XMLCorpus

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
            yield os.path.join(self.data_directory, filename), {}

    fields = [ ]
