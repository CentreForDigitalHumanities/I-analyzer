import os

import pytest

here = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture()
def gallica_corpus_settings(settings):
    settings.CORPORA = {
        "figaro": os.path.join(here, "figaro.py"),
    }


class MockResponse(object):
    def __init__(self, filepath):
        self.mock_content_file = filepath

    @property
    def content(self):
        with open(self.mock_content_file, "r") as f:
            return f.read()


def mock_response(url: str) -> MockResponse:
    if url.endswith("date"):
        filename = os.path.join(here, "tests", "data", "figaro", "Years.xml")
    elif "&" in url:
        filename = os.path.join(here, "tests", "data", "figaro", "Issues.xml")
    elif "?" in url:
        filename = os.path.join(here, "tests", "data", "figaro", "OAIRecord.xml")
    elif url.endswith("texteBrut"):
        filename = os.path.join(here, "tests", "data", "figaro", "RoughText.html")
    return MockResponse(filename)
