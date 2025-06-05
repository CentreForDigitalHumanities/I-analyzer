import os

import pytest
from requests import Response
from unittest.mock import Mock

here = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture()
def gallica_corpus_settings(settings):
    settings.CORPORA = {
        "figaro": os.path.join(here, "figaro.py"),
    }


def mock_content(filename):
    with open(filename, "r") as f:
        return f.read()


def mock_response(url: str) -> Response:
    if url.endswith("date"):
        filename = os.path.join(here, "tests", "data", "figaro", "Years.xml")
    elif "&" in url:
        filename = os.path.join(here, "tests", "data", "figaro", "Issues.xml")
    elif "?" in url:
        filename = os.path.join(here, "tests", "data", "figaro", "OAIRecord.xml")
    elif url.endswith("texteBrut"):
        filename = os.path.join(here, "tests", "data", "figaro", "RoughText.html")
    mock = Mock(spec=Response)
    mock.status_code = 200
    mock.content = mock_content(filename)
    return mock


def mock_sleep(seconds: int):
    pass
