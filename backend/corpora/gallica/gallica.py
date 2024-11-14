from datetime import datetime
import logging

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

logger = logging.getLogger('indexing')

def get_content(content: BeautifulSoup) -> str:
    """Return text content in the parsed HTML file from the `texteBrut` request
    This is contained in the first <p> element after the first <hr> element.
    """
    text_nodes = content.find("hr").find_next_siblings("p")
    return "".join([node.get_text() for node in text_nodes])


def get_publication_id(identifier: str) -> str:
    try:
        return identifier.split("/")[-1]
    except:
        return None


class Gallica(XMLCorpusDefinition):

    languages = ["fr"]
    data_url = "https://gallica.bnf.fr"
    corpus_id = ""  # each corpus on Gallica has an "ark" id

    def sources(self, start: datetime, end: datetime):
        # obtain list of ark numbers
        response = requests.get(
            f"{self.data_url}/services/Issues?ark=ark:/12148/{self.corpus_id}/date"
        )
        year_soup = BeautifulSoup(response.content, "xml")
        years = [
            year.string
            for year in year_soup.find_all("year")
            if int(year.string) >= start.year and int(year.string) <= end.year
        ]
        for year in years:
            try:
                response = requests.get(
                    f"{self.data_url}/services/Issues?ark=ark:/12148/{self.corpus_id}/date&date={year}"
                )
                ark_soup = BeautifulSoup(response.content, "xml")
                ark_numbers = [
                    issue_tag["ark"] for issue_tag in ark_soup.find_all("issue")
                ]
            except ConnectionError:
                logger.warning(f"Connection error when processing year {year}")
                break

            for ark in ark_numbers:
                try:
                    source_response = requests.get(
                        f"{self.data_url}/services/OAIRecord?ark={ark}"
                    )
                except ConnectionError:
                    logger.warning(f"Connection error encountered in issue {ark}")
                    break

                if source_response:
                    try:
                        content_response = requests.get(
                            f"{self.data_url}/ark:/12148/{ark}.texteBrut"
                        )
                    except ConnectionError:
                        logger.warning(
                            f"Connection error when fetching full text of issue {ark}"
                        )
                    parsed_content = BeautifulSoup(
                        content_response.content, "lxml-html"
                    )
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
            extractor=XML(Tag("dc:identifier"), transform=get_publication_id),
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
