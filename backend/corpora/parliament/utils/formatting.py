## Various helper functions for formatting

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

def underscore_to_space(input_string, title_case=True):
    """
    Given an input string with underscores, replace underscores with spaces
    Optionally, transform the parts of the string into title case
    """
    if input_string:
        parts = input_string.split('_')
        if title_case:
            parts = [p.title() for p in parts if type(p[0]) == str]
        return ' '.join(parts)

