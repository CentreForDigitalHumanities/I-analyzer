from datetime import datetime

from bs4 import BeautifulSoup
from ianalyzer_readers.xml_tag import Tag
from ianalyzer_readers.extract import Metadata, XML
import requests

from addcorpus.python_corpora.corpus import XMLCorpusDefinition
from addcorpus.python_corpora.corpus import FieldDefinition
from addcorpus.python_corpora.filters import DateFilter
from addcorpus.es_mappings import (
    keyword_mapping,
    date_mapping,
    main_content_mapping,
)


def get_content(content: BeautifulSoup) -> str:
    """Return text content in the parsed HTML file from the `texteBrut` request
    This is contained in the first <p> element after the first <hr> element.
    """
    return content.find("hr").find_next_sibling("p").string


class Gallica(XMLCorpusDefinition):

    languages = ["fr"]
    data_url = "https://gallica.bnf.fr"
    corpus_ark = ""

    def sources(self, start: datetime, end: datetime):
        # obtain list of ark numbers
        response = requests.get(
            f"{self.data_url}/services/Issues?ark=ark:/12148/{self.corpus_ark}/date"
        )
        year_soup = BeautifulSoup(response.content, "xml")
        years = [
            year.string
            for year in year_soup.find_all("year")
            if int(year.string) >= start.year and int(year.string) <= end.year
        ]
        for year in years:
            response = requests.get(
                f"{self.data_url}/services/Issues?ark=ark:/12148/{self.corpus_ark}/date&date={year}"
            )
            ark_soup = BeautifulSoup(response.content, "xml")
            ark_numbers = [issue_tag["ark"] for issue_tag in ark_soup.find_all("issue")]

            for ark in ark_numbers:
                source_response = requests.get(
                    f"{self.data_url}/services/OAIRecord?ark={ark}"
                )
                if source_response:
                    content_response = requests.get(
                        f"{self.data_url}/ark:/12148/{ark}.texteBrut"
                    )
                    parsed_content = BeautifulSoup(content_response.content, "html")
                    yield (
                        source_response.content,
                        {"content": parsed_content},
                    )

    def content(self):
        return FieldDefinition(
            name="content",
            description="Content of publication",
            es_mapping=main_content_mapping(
                token_counts=True,
                stopword_analysis=True,
                stemming_analysis=True,
                language=self.languages[0],
            ),
            extractor=Metadata("content", transform=get_content),
        )

    def date(self, min_date: datetime, max_date: datetime):
        return FieldDefinition(
            name="date",
            display_name="Date",
            description="The date of the publication.",
            es_mapping=date_mapping(),
            extractor=XML(
                Tag("dc:date"),
            ),
            results_overview=True,
            search_filter=DateFilter(
                min_date, max_date, description="Search only within this time range."
            ),
            visualizations=["resultscount", "termfrequency"],
            csv_core=True,
        )

    def identifier(self):
        return FieldDefinition(
            name="id",
            display_name="Publication ID",
            description="Identifier of the publication on Gallica",
            es_mapping=keyword_mapping(),
            extractor=XML(Tag("dc:identifier"), transform=lambda x: x.split("/")[-1]),
            csv_core=True,
        )

    def url(self):
        return FieldDefinition(
            name="url",
            display_name="Source URL",
            display_type="url",
            description="URL to scan on Gallica",
            es_mapping=keyword_mapping(),
            extractor=XML(Tag("dc:identifier")),
            searchable=False,
        )

    # define fields property so it can be set in __init__
    @property
    def fields(self):
        return self._fields

    @fields.setter
    def fields(self, value):
        self._fields = value
