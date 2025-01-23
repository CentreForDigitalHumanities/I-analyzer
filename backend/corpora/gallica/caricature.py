from datetime import datetime

from django.conf import settings

from corpora.gallica.gallica import Gallica


class Caricature(Gallica):
    title = "La Caricature"
    description = "Satirical periodical, 1830-1843"
    min_date = datetime(year=1854, month=1, day=1)
    max_date = datetime(year=1954, month=12, day=31)
    corpus_id = "cb344523348"
    category = "periodical"
    es_index = getattr(settings, 'CARICATURE_INDEX', 'caricature')
    image = "caricature.jpg"
