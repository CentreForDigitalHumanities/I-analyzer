import datetime
import os
from typing import Dict, Optional, Union

import numpy as np
import pandas as pd

from addcorpus.models import Corpus
import csv


def get_csv_info(path: Union[str, os.PathLike], **kwargs) -> Dict:
    '''Get information about a CSV file'''
    encoding = kwargs.get('encoding', 'utf-8')
    # sniff out CSV dialect to find delimiter
    with open(path, 'r', encoding=encoding) as f:
        dialect = csv.Sniffer().sniff(f.read(1024))
        f.seek(0)
    df = pd.read_csv(path, encoding=encoding, sep=dialect.delimiter, **kwargs)
    info = {
        'n_rows': len(df),
        'fields': {col_name: map_col(df[col_name]) for col_name in df.columns},
        'delimiter': dialect.delimiter,
    }
    return info


def map_col(col: pd.Series) -> str:
    if col.dtypes == object:
        if is_date_col(col):
            return 'date'
        return 'text'
    elif col.dtypes == np.float64:
        return 'float'
    elif col.dtypes == np.int64:
        return 'integer'
    elif col.dtypes == bool:
        return 'boolean'
    return 'text'


def is_date_col(col: pd.Series) -> bool:
    '''Check if a column only contains dates or missing values
    Converts empty strings to None because they are non picked up by `isna()`
    '''
    non_null = col.replace('', None)
    non_null = non_null[~non_null.isna()]
    if non_null.empty:
        return False
    mask = non_null.transform(is_date)
    return mask.all()


def is_date(input: str) -> Optional[datetime.datetime]:
    try:
        datetime.datetime.strptime(input, '%Y-%m-%d')
        return True
    except (ValueError, TypeError):
        return False


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
