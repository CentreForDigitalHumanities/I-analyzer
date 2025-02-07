import os

import pytest

here = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture()
def gallica_corpus_settings(settings):
    settings.CORPORA = {
        "caricature": os.path.join(here, "caricature.py"),
        "figaro": os.path.join(here, "figaro.py"),
        "resistance": os.path.join(here, "resistance.py"),
    }


class MockResponse(object):
    def __init__(self, filepath):
        self.mock_content_file = filepath

    @property
    def content(self):
        with open(self.mock_content_file, "r") as f:
            return f.read()

    @property
    def status_code(self):
        return 200


class MockResponseFactory(object):
    def __init__(self, corpus_name: str):
        self.filepath = os.path.join(here, "tests", "data", corpus_name)

    def mock_response(self, url: str) -> MockResponse:
        if url.endswith("date"):
            filename = os.path.join(self.filepath, "Years.xml")
        elif "&" in url:
            filename = os.path.join(self.filepath, "Issues.xml")
        elif "?" in url:
            filename = os.path.join(self.filepath, "OAIRecord.xml")
        elif url.endswith("texteBrut"):
            filename = os.path.join(self.filepath, "RoughText.html")
        return MockResponse(filename)


def mock_sleep(seconds: int):
    pass
