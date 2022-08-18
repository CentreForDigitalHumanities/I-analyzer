## Various helper functions for formatting
from datetime import datetime
import re

def format_page_numbers(pages):
    """
    Given a list of page/column numbers, return a string formatted as '{min}-{max}',
    or '{value}' if there is only one unique value.
    """

    if pages and len(pages) >= 1:
        start = min(pages)
        stop = max(pages)

        if start == stop:
            return str(start)
        else:
            return '{}-{}'.format(start, stop)

def underscore_to_space(input_string, title_case=True):
    """
    Given an input string with underscores, replace underscores with spaces
    Optionally, transform the parts of the string into title case
    """
    if input_string:
        parts = input_string.split('_')
        joined = ' '.join([part for part in parts if part])
        return joined.title() if title_case else joined


def extract_year(datestring, pattern = r'(\d{4})-\d{2}-\d{2}'):
    """
    Get the year from a yyyy-mm-dd datestring
    Optionally, a different regular expression can be provided, where the first group captures the year.
    """
    if datestring:
        match = re.match(pattern, datestring)

        if match:
            year = match.group(1)
            return int(year)

def get_date_from_year(value, limit='earliest'):
    """
    Get a yyyy-mm-dd string from the year. Parameters:
    - `value`: a string of digits indicating the year
    - `limit` (optional): set to 'earliest' to return January 1st, 'latest' to return December 31st.
    """
    if value and value.isnumeric():
        year = int(value)
        if limit == 'earliest':
            date = datetime(year=year, month=1, day=1)
        else:
            date = datetime(year=year, month=12, day=31)
        return date.strftime('%Y-%m-%d')
