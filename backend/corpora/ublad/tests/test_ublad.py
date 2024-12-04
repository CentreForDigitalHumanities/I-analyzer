import locale
import pytest
from corpora.ublad.ublad import transform_date
import datetime


def test_transform_date():
    datestring = '6 september 2007'
    goal_date = datetime.date(2007, 9, 6)
    try:
        date = transform_date(datestring)
    except locale.Error:
        pytest.skip('Dutch Locale not installed in environment')
    assert date == str(goal_date)
