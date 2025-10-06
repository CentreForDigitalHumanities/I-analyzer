from datetime import datetime

from addcorpus.python_corpora.corpus import CorpusDefinition


def in_date_range(corpus: CorpusDefinition, start: datetime, end: datetime) -> bool:
    start_date = start or corpus.min_date
    end_date = end or corpus.max_date

    return start_date <= corpus.max_date and end_date >= corpus.min_date
