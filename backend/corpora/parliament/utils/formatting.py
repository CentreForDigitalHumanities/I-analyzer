## Various helper functions for formatting

from typing import Dict


def format_page_numbers(pages):
    """
    Given a list of page/column numbers, return a string formatted as '{min}-{max}',
    or '{value}' if there is only one unique value.
    """

    if pages and len(pages) >= 1:
        start = min(pages)
        stop = max(pages)

        if start == stop:
            return start
        else:
            return '{}-{}'.format(start, stop)
