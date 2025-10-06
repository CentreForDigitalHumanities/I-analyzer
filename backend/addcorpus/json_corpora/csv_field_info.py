import datetime
import os
from typing import Callable, Dict, Optional, Union, Any

import numpy as np
import pandas as pd

from django.core.validators import URLValidator
from django.core.exceptions import ValidationError


def get_csv_info(path: Union[str, os.PathLike], **kwargs) -> Dict:
    df = pd.read_csv(path, **kwargs)
    info = {
        col_name: map_col(df[col_name]) for col_name in df.columns
    }
    return info


def map_col(col: pd.Series) -> str:
    if col.dtypes == object:
        if is_url_col(col):
            return 'url'
        if is_date_col(col):
            return 'date'
        if is_long_text_col(col):
            return 'text_content'
        return 'text_metadata'
    elif col.dtypes == np.float64:
        return 'float'
    elif col.dtypes == np.int64:
        return 'integer'
    elif col.dtypes == bool:
        return 'boolean'
    return 'text_metadata'


def col_is_null_or_type(col: pd.Series, coltype: Callable[[Any], bool]) -> bool:
    '''Check if a column only contains the desired type or missing values.
    Converts empty strings to None because they are not picked up by `isna()`
    '''
    non_null = col.replace('', None)
    non_null = non_null[~non_null.isna()]
    if non_null.empty:
        return False
    mask = non_null.transform(coltype)
    return mask.all()


def is_date_col(col: pd.Series) -> bool:
    return col_is_null_or_type(col, is_date)


def is_url_col(col: pd.Series) -> bool:
    return col_is_null_or_type(col, is_url)


def is_date(input: str) -> Optional[datetime.datetime]:
    try:
        datetime.datetime.strptime(input, '%Y-%m-%d')
        return True
    except (ValueError, TypeError):
        return False


def is_url(input: str) -> bool:
    validator = URLValidator()
    try:
        validator(input)
        return True
    except ValidationError:
        return False


def is_long_text(value: Any) -> bool:
    return isinstance(value, str) and (len(value) > 100 or '\n' in value)


def is_long_text_col(col: pd.Series) -> bool:
    return col.apply(is_long_text).any()
