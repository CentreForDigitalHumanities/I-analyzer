from flask import current_app
from corpora.peaceportal.peaceportal import PeacePortal

class FIJISEPARATE(PeacePortal):

    es_index = current_app.config['FIJI_ALIAS']

    # all fields listed here will be ignored if they are
    # in the PeacePortal base class definition. Ideal for excluding
    # filters that are irrelevant
    redundant_fields = ['source_database', 'region']

    def __init__(self):
        for field in self.fields:
            if field.name in self.redundant_fields:
                self.fields.remove(field)
