from addcorpus.citation import render_citation
from datetime import date
from unittest.mock import patch

expected = '''## APA

> Centre for Digital Humanities, Utrecht University (2024). *Example corpus* [data set]. URL: http://localhost:4200

## MLA

> Centre for Digital Humanities, Utrecht University. *Example corpus*, http://localhost:4200. Accessed 1 January 2024.
'''

def test_citation_page(mock_corpus):
    # monkeypatch.setattr(date, 'today', lambda : date(2024, 1, 1))

    with patch('addcorpus.citation.date') as mock_date:
        mock_date.today.return_value = date(2024, 1, 1)

        result = render_citation(mock_corpus)
        assert result == expected
