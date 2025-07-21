import re
from datetime import datetime
import openpyxl
import os.path
import PIL

from django.utils.functional import classproperty
from ianalyzer_readers.xml_tag import Tag, SiblingTag, ParentTag
from ianalyzer_readers import extract

from addcorpus.python_corpora import filters
from addcorpus.python_corpora.corpus import XMLCorpusDefinition, FieldDefinition
from addcorpus.es_mappings import keyword_mapping, main_content_mapping
from addcorpus.es_settings import es_settings
from api.utils import find_media_file
from media.media_url import media_url


def fix_path_sep(path):
    return path.replace('\\', os.path.sep).lstrip(os.path.sep).strip()


class GaleCorpus(XMLCorpusDefinition):
    @property
    def es_settings(self):
        return es_settings(self.languages[:1], stopword_analysis=True, stemming_analysis=True)

    tag_toplevel = Tag('articles')
    tag_entry = Tag('artInfo')
    external_file_tag_toplevel = Tag('issue')

    scan_image_type = 'image/png'

    def sources(self, start, end):
        filename, sheet = self.metafile
        wb = openpyxl.load_workbook(filename=filename)
        for index, row in enumerate(wb[sheet].values):
            # skip first row, and rows without date
            if index==0 or not row[1]:
                continue

            publication_tile, issue_date, image_location, data_location, filename = row

            data_location = fix_path_sep(data_location)
            image_path = fix_path_sep(image_location)

            if issue_date.startswith('[') and issue_date.endswith(']'):
                issue_date = issue_date[1:-1]

            if issue_date == 'Date Unknown':
                date_full = None
            else:
                date_full = datetime.strptime(issue_date, '%B %d, %Y').strftime('%Y-%m-%d')

            issue_id = filename.split("_")[0]
            external_file = os.path.join(self.data_directory, data_location, filename)
            xml_file = os.path.join(self.data_directory, data_location, issue_id + '_Text.xml')
            if not os.path.isfile(xml_file):
                print("File {} not found".format(xml_file))
                continue

            meta = dict(title=publication_tile, image_path=image_path, issue_id=issue_id, external_file=external_file,
                        date_full=date_full)
            yield xml_file, meta

    def process_scan(self, src):
        dst = src
        base, ext = os.path.splitext(src)
        if ext.lower() == '.tif':
            dst = base + '.png'
            if not os.path.isfile(dst):
                PIL.Image.open(src).save(dst)
        return dst

    @classproperty
    def date(cls):
        return FieldDefinition(
            name="date",
            display_name="Formatted Date",
            description="Publication date, formatted from the full date",
            es_mapping={"type": "date", "format": "yyyy-MM-dd"},
            histogram=True,
            search_filter=filters.DateFilter(
                cls.min_date,
                cls.max_date,
                description=(
                    "Accept only articles with publication date in this range."
                ),
            ),
            extractor=extract.Metadata("date"),
            csv_core=True,
            visualizations=["resultscount", "termfrequency"],
        )
    date_pub = FieldDefinition(
        name="date_pub",
        display_name="Publication Date",
        description="Publication date as full string, as found in source file",
        es_mapping=keyword_mapping(),
        results_overview=True,
        extractor=extract.Metadata("date_full"),
    )
    id = FieldDefinition(
        name="id",
        display_name="ID",
        description="Unique identifier of the entry.",
        es_mapping=keyword_mapping(),
        extractor=extract.XML(attribute="id"),
    )
    issue = FieldDefinition(
        name="issue",
        display_name="Issue number",
        description="Source issue number.",
        es_mapping=keyword_mapping(),
        results_overview=False,
        extractor=extract.Metadata("issue_id"),
        csv_core=False,
    )
    periodical = FieldDefinition(
        name="periodical",
        display_name="Periodical name",
        histogram=True,
        results_overview=True,
        es_mapping={"type": "keyword"},
        description="Periodical name.",
        search_filter=filters.MultipleChoiceFilter(
            description="Search only within these periodicals.", option_count=90
        ),
        extractor=extract.Metadata("title"),
        csv_core=True,
        visualizations=["resultscount", "termfrequency"],
    )
    content = FieldDefinition(
        name="content",
        display_name="Content",
        display_type="text_content",
        description="Text content.",
        es_mapping=main_content_mapping(True, True, True, "en"),
        results_overview=True,
        extractor=extract.XML(Tag("ocrText"), flatten=True),
        search_field_core=True,
        visualizations=["wordcloud", "ngram"],
        language="en",
    )
    ocr = FieldDefinition(
        name="ocr",
        display_name="OCR confidence",
        description="OCR confidence level.",
        es_mapping={"type": "float"},
        search_filter=filters.RangeFilter(
            0,
            100,
            description=(
                "Accept only articles for which the Opitical Character Recognition confidence "
                "indicator is in this range."
            ),
        ),
        extractor=extract.XML(
            lambda metadata: Tag("id", string=metadata["id"]),
            SiblingTag("ocr"),
            external_file=True,
        ),
        sortable=True,
    )
    title_field = FieldDefinition(
        name="title",
        display_name="Article title",
        description="Title of the article.",
        extractor=extract.XML(
            lambda metadata: Tag("id", string=metadata["id"]),
            SiblingTag("ti"),
            external_file=True,
        ),
        visualizations=["wordcloud"],
    )
    start_column = FieldDefinition(
        name="start_column",
        es_mapping={"type": "keyword"},
        display_name="Starting column",
        description="Which column the article starts in.",
        extractor=extract.XML(
            lambda metadata: Tag("id", string=metadata["id"]),
            SiblingTag("sc"),
            external_file=True,
        ),
    )
    page_count = FieldDefinition(
        name="page_count",
        display_name="Page count",
        description="How many pages the article covers.",
        es_mapping={"type": "integer"},
        extractor=extract.XML(
            lambda metadata: Tag("id", string=metadata["id"]),
            SiblingTag("pc"),
            external_file=True,
        ),
    )
    word_count = FieldDefinition(
        name="word_count",
        display_name="Word count",
        description="Number of words in the article.",
        es_mapping={"type": "integer"},
        extractor=extract.XML(
            lambda metadata: Tag("id", string=metadata["id"]),
            SiblingTag("wordCount"),
            external_file=True,
        ),
    )
    category_field = FieldDefinition(
        name="category",
        csv_core=True,
        display_name="Category",
        description="Article category.",
        es_mapping={"type": "keyword"},
        extractor=extract.XML(
            lambda metadata: Tag("id", string=metadata["id"]),
            SiblingTag("ct"),
            external_file=True,
        ),
        search_filter=filters.MultipleChoiceFilter(
            description="Accept only articles in these categories.", option_count=26
        ),
        visualizations=["resultscount", "termfrequency"],
    )
    page_no = FieldDefinition(
        name="page_no",
        display_name="Page number",
        description="At which page the article starts.",
        es_mapping={"type": "integer"},
        extractor=extract.XML(
            lambda metadata: Tag("id", string=metadata["id"]),
            ParentTag(2),
            Tag("pa"),
            external_file=True,
            transform=lambda x: re.sub(r"[\[\]]", "", x),
        ),
    )
    image_path = FieldDefinition(
        name="image_path",
        display_name="Image path",
        es_mapping={"type": "keyword"},
        description="Path of scan.",
        extractor=extract.Metadata("image_path"),
        hidden=True,
        downloadable=False,
    )


    @classproperty
    def fields(cls):
        return [
            cls.date,
            cls.date_pub,
            cls.id,
            cls.issue,
            cls.periodical,
            cls.content,
            cls.ocr,
            cls.title_field,
            cls.start_column,
            cls.page_count,
            cls.word_count,
            cls.category_field,
            cls.page_no,
            cls.image_path,
        ]

    document_context = {
        'context_fields': ['issue'],
        'sort_field': 'page_no',
        'sort_direction': 'asc',
        'context_display_name': 'issue'
    }

    def resolve_media_path(self, field_vals, corpus_name):
        image_directory = field_vals['image_path']
        starting_page = field_vals['id'][:-4]
        start_index = int(starting_page.split("-")[-1])
        page_count = int(field_vals['page_count'])

        image_list = []
        for page in range(page_count):
            page_no = str(start_index + page).zfill(3)
            prefix = starting_page.rsplit('-', 1)[0]
            image_name = '{}-{}.tif'.format(prefix, page_no)
            image_path = os.path.join(image_directory, image_name)

            # while we serve PNGs, converting or looking up an existing converted file is handled in self.process_scan()
            # so here we still have to look for the source TIFFs
            full_path = find_media_file(self.data_directory, image_path, 'image/tiff')
            if full_path is not None:
                image_list.append(full_path)
            else:
                continue
        return image_list

    def request_media(self, document, corpus_name):
        media = self.resolve_media_path(document['fieldValues'], corpus_name)

        # scans are processed on the fly if they're not pre-processed
        urls = [media_url(corpus_name, self.process_scan(m)) for m in media]
        return dict(media=urls)
