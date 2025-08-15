import datetime
import os
from typing import Union

from addcorpus.models import Corpus


def normalize_date_to_year(input: Union[datetime.date, datetime.datetime, int]) -> int:
    if isinstance(input, datetime.datetime) or isinstance(input, datetime.date):
        return input.year
    elif isinstance(input, int):
        return input
    else:
        raise TypeError(f'Unexpected date type: {type(input)}')


def clear_corpus_image(corpus: Corpus):
    if corpus.configuration_obj and corpus.configuration.image:
        image = corpus.configuration.image
        if image:
            if os.path.exists(image.path):
                os.remove(image.path)

            image.delete()
