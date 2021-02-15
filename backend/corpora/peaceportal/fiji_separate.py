from corpora.peaceportal.peaceportal import PeacePortal

class FIJISEPARATE(PeacePortal):

    es_index = es_index = current_app.config['PEACEPORTAL_FIJI_ES_INDEX']
    es_alias = current_app.config['FIJI_ALIAS']

    # all fields listed here will be ignored if they are
    # in the PeacePortal base class definition. Ideal for excluding
    # filters that are irrelevant
    redundant_fields = ['source_database', 'region']

    def __init__(self):
        for field in self.fields:
            if field.name in self.redundant_fields:
                self.fields.remove(field)
