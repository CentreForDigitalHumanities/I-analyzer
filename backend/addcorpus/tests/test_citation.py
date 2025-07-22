from addcorpus.documentation import render_documentation_context
from datetime import date
from unittest.mock import patch
import pytest
import os

expected = '''## APA

> Centre for Digital Humanities, Utrecht University (2024). *Example corpus* [data set]. URL: http://localhost:4200

## MLA

> Centre for Digital Humanities, Utrecht University. *Example corpus*, http://localhost:4200. Accessed 1 January 2024.
'''

@pytest.fixture()
def citation_template(settings):
    path = os.path.join(settings.BASE_DIR, 'corpora_test', 'basic', 'citation', 'citation.md')
    with open(path) as f:
        return f.read()

def test_citation_page(citation_template):
    with patch('addcorpus.documentation.date') as mock_date:
        mock_date.today.return_value = date(2024, 1, 1)

        result = render_documentation_context(citation_template)
        assert result == expected


def test_contradiction():
    assert False is True
