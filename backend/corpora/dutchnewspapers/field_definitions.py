from addcorpus.es_mappings import keyword_mapping, main_content_mapping
from addcorpus.python_corpora.corpus import FieldDefinition
from addcorpus.python_corpora.filters import DateFilter, MultipleChoiceFilter, RangeFilter

def article_category():
    return FieldDefinition(
        name="category",
        display_name="Category",
        description="Whether the item is an article, advertisment, etc.",
        csv_core=True,
        es_mapping={"type": "keyword"},
        search_filter=MultipleChoiceFilter(
            description="Accept only articles in these categories.",
            option_count=2,
        ),
    )

def article_title():
    return  FieldDefinition(
        name="article_title",
        display_name="Article title",
        description="Article title",
        results_overview=True,
        search_field_core=True,
        searchable=True,
    )

def circulation():
    return FieldDefinition(
        name="circulation",
        display_name="Circulation",
        description="The area in which the newspaper was distributed.",
        es_mapping={"type": "keyword"},
        csv_core=True,
        search_filter=MultipleChoiceFilter(
            description="Accept only articles appearing in specific areas.",
            option_count=7,
        ),
    )

def content():
    return FieldDefinition(
        name="content",
        display_name="Content",
        display_type="text_content",
        description="Text content.",
        es_mapping=main_content_mapping(True, True, True, "nl"),
        results_overview=True,
        search_field_core=True,
        visualizations=["wordcloud", "ngram"],
        language="nl",
    )

def date(min_date, max_date):
    return FieldDefinition(
        name="date",
        display_name="Date",
        description="Publication date.",
        es_mapping={"type": "date", "format": "yyyy-MM-dd"},
        results_overview=True,
        csv_core=True,
        visualizations=["resultscount", "termfrequency"],
        search_filter=DateFilter(
            min_date,
            max_date,
            description=(
                "Accept only articles with publication date in this range."
            ),
        )
    )

def identifier():
    return FieldDefinition(
        name="id",
        display_name="ID",
        description="Unique identifier of the entry.",
    )

def issue_number():
    return FieldDefinition(
        name="issue_number",
        display_name="Issue number",
        description="Issue number of the newspaper",
        csv_core=True,
        es_mapping={"type": "integer"},
    )

def language():
    return FieldDefinition(
        name="language",
        display_name="Language",
        description="language",
        es_mapping={"type": "keyword"},
    )

def newspaper_title(n_papers):
    return FieldDefinition(
        name="newspaper_title",
        display_name="Newspaper title",
        description="Title of the newspaper",
        results_overview=True,
        es_mapping={"type": "keyword"},
        visualizations=["resultscount", "termfrequency"],
        search_filter=MultipleChoiceFilter(
            description="Accept only articles in these newspapers.",
            option_count=n_papers,
        ),
    )

def ocr_confidence():
    return FieldDefinition(
        name="ocr",
        display_name="OCR confidence",
        description="OCR confidence level.",
        es_mapping={"type": "float"},
        search_filter=RangeFilter(
            0,
            100,
            description=(
                "Accept only articles for which the Opitical Character Recognition confidence "
                "indicator is in this range."
            ),
        ),
        sortable=True,
    )

def publication_place():
    return FieldDefinition(
        name="pub_place",
        display_name="Publication Place",
        description="Where the newspaper was published",
        es_mapping={"type": "keyword"},
    )

def publisher():
    return FieldDefinition(
        name="publisher",
        display_name="Publisher",
        description="Publisher",
        es_mapping=keyword_mapping(),
    )

def source():
    return FieldDefinition(
        name="source",
        display_name="Source",
        description="Library or archive which keeps the hard copy of this newspaper.",
        es_mapping={"type": "keyword"},
    )

def temporal():
    return FieldDefinition(
        name="temporal",
        display_name="Edition",
        description="Newspaper edition for the given date",
        results_overview=True,
        csv_core=True,
        es_mapping={"type": "keyword"},
        visualizations=["resultscount", "termfrequency"],
        search_filter=MultipleChoiceFilter(
            description="Accept only articles in newspapers which appeared as a given edition.",
            option_count=3,
        ),
    )

def url(): 
    return FieldDefinition(
        name="url",
        display_name="Delpher URL",
        description="Link to record on Delpher",
        display_type="url",
        es_mapping=keyword_mapping(),
    )

def version_of():
    return FieldDefinition(
        name="version_of",
        display_name="Version of",
        description="The newspaper is a version of this newspaper.",
        es_mapping={"type": "keyword"},
    )
