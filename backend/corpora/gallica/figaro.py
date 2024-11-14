from datetime import datetime
from typing import Union

from django.conf import settings
from ianalyzer_readers.xml_tag import Tag
from ianalyzer_readers.extract import XML

from addcorpus.python_corpora.corpus import FieldDefinition
from addcorpus.es_mappings import (
    keyword_mapping,
)

from corpora.gallica.gallica import Gallica


def join_issue_strings(issue_description: Union[list[str], None]) -> Union[str, None]:
    if issue_description:
        return "".join(issue_description[:2])


class Figaro(Gallica):
    description = "Le Figaro (newspaper), 1854-1953"
    min_date = datetime(year=1854, month=1, day=1)
    max_date = datetime(year=1953, month=12, day=31)
    corpus_id = "cb34355551z"
    category = "newspaper"
    image = "figaro.jpg"

    contributor = FieldDefinition(
        name="contributor",
        description="Persons who contributed to this issue",
        es_mapping=keyword_mapping(enable_full_text_search=True),
        extractor=XML(Tag("dc:contributor"), multiple=True),
    )

    issue = FieldDefinition(
        name="issue",
        description="Issue description",
        es_mapping=keyword_mapping(),
        extractor=XML(
            Tag("dc:description"), multiple=True, transform=join_issue_strings
        ),
    )

    def __init__(self):
        self.fields = [
            self.content(),
            self.contributor,
            self.date(self.min_date, self.max_date),
            self.identifier(),
            self.issue,
            self.url(),
        ]
