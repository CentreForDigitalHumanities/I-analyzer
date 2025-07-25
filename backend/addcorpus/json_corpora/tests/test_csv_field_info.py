from addcorpus.json_corpora.csv_field_info import is_date, is_date_col
import pandas as pd


def test_is_date():
    assert is_date('2024-01-01')
    assert not is_date(None)
    assert not is_date(5)
    assert not is_date('01-01-2024')


def test_is_date_col():
    clean_date_series = pd.Series(['1800-01-01', '2024-01-01'])
    dirty_date_series = pd.concat([clean_date_series, pd.Series([None, ''])])
    empty_series = pd.Series([None, None])

    assert is_date_col(clean_date_series)
    assert is_date_col(dirty_date_series)
    assert not is_date_col(empty_series)
