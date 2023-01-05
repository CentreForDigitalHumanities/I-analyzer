'''
Collect corpus-specific information, that is, data structures and file
locations.

Until 1985, the XML structure of Times-data is described by `LTO_issue.dtd`.
After 1985, it is described by `GALENP.dtd`.
'''

import logging
logger = logging.getLogger(__name__)
import os
import os.path
from datetime import datetime, timedelta

from flask import current_app, url_for

from addcorpus import extract
from addcorpus import filters
from addcorpus.corpus import XMLCorpus, Field, until, after, string_contains, consolidate_start_end_years


# Source files ################################################################


class Times(XMLCorpus):
    title = "Times"
    description = "Newspaper archive, 1785-2010"
    min_date = datetime(year=1785, month=1, day=1)
    max_date = datetime(year=2010, month=12, day=31)
    data_directory = current_app.config['TIMES_DATA']
    es_index = current_app.config['TIMES_ES_INDEX']
    es_doctype = current_app.config['TIMES_ES_DOCTYPE']
    image = current_app.config['TIMES_IMAGE']
    scan_image_type = current_app.config['TIMES_SCAN_IMAGE_TYPE']
    description_page = current_app.config['TIMES_DESCRIPTION_PAGE']

    tag_toplevel = 'issue'
    tag_entry = 'article'

    def sources(self, start=datetime.min, end=datetime.max):
        '''
        Obtain source files for the Times data, relevant to the given timespan.

        Specifically, returns an iterator of tuples that each contain a string
        filename and a dictionary of metadata (in this case, the date).
        '''
        consolidate_start_end_years(start, end, self.min_date, self.max_date)
        date = start
        delta = timedelta(days=1)
        while date <= end:

            # Construct the tag to the correct directory
            xmldir = os.path.join(*[
                self.data_directory,
                'TDA_GDA'
            ] + (
                ['TDA_2010']
                if date.year == 2010 else
                ['TDA_GDA_1785-2009', date.strftime('%Y')]
            ))

            # Skip this year if its directory doesn't exist
            if not os.path.isdir(xmldir):
                logger.warning('Directory {} does not exist'.format(xmldir))
                date = datetime(year=date.year + 1, month=1, day=1)
                continue

            # Construct the full tag
            xmlfile = os.path.join(
                xmldir,
                date.strftime('%Y%m%d'),
                date.strftime('0FFO-%Y-%m%d.xml')
                if date.year > 1985 else
                date.strftime('0FFO-%Y-%b%d').upper() + '.xml'
            )

            # Yield file and metadata if the desired file is present
            if os.path.isfile(xmlfile):
                yield (xmlfile, {'date': date})
            else:
                logger.warning('XML file {} does not exist'.format(xmlfile))

            date += delta

    fields = [
        Field(
            name='date',
            display_name='Publication Date',
            description='Publication date, parsed to yyyy-MM-dd format',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            hidden=True,
            visualizations=['resultscount', 'termfrequency'],
            search_filter=filters.DateFilter(
                min_date,
                max_date,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=extract.Metadata('date',
                                       transform=lambda x: x.strftime(
                                           '%Y-%m-%d')
                                       )
        ),
        # Field(indexed=False,
        #       name='issue-id',
        #       display_name='Issue ID',
        #       description='Issue identifier.',
        #       extractor=extract.XML(tag='id', toplevel=True)
        #       ),
        # Field(indexed=False,
        #       name='journal',
        #       display_name='Journal',
        #       description='Journal name.',
        #       extractor=extract.XML(
        #           tag='jn', toplevel=True,
        #           applicable=until(1985)
        #       )
        #       ),
        Field(
            name='source',
            display_name='Source',
            description='Library where the microfilm is sourced',
            extractor=extract.XML(
                tag=['metadatainfo', 'sourceLibrary'], toplevel=True,
                applicable=after(1985)
            )
        ),
        # Field(indexed=False,
        #       name='newspaperID',
        #       display_name='Newspaper ID',
        #       description='Publication code',
        #       extractor=extract.XML(
        #           tag=['metadatainfo', 'newspaperID'], toplevel=True,
        #           applicable=after(1985)
        #       )
        #       ),
        Field(
            name='edition',
            display_name='Edition',
            extractor=extract.Choice(
                extract.XML(
                    tag='ed', toplevel=True,
                    applicable=until(1985)
                ),
                extract.XML(
                    tag='ed', toplevel=True, multiple=True,
                    applicable=after(1985)
                )
            ),
            csv_core=True
        ),
        Field(
            name='issue',
            display_name='Issue number',
            es_mapping={'type': 'integer'},
            description='Source issue number.',
            extractor=extract.XML(
                tag='is', toplevel=True,
                # Hardcoded to ignore one particular issue with source data
                transform=lambda x: (62226 if x == "6222662226" else int(x))
            ),
            sortable=True,
            csv_core=True
        ),
        Field(
            name='volume',
            display_name='Volume',
            description='Volume number.',
            extractor=extract.XML(
                tag='volNum', toplevel=True,
                applicable=after(1985)
            ),
            csv_core=True
        ),
        Field(
            name='date-pub',
            display_name='Publication Date',
            csv_core=True,
            results_overview=True,
            description='Publication date as full string, as found in source file',
            extractor=extract.XML(
                tag='da', toplevel=True
            )
        ),
        Field(
            name='ocr',
            display_name='OCR confidence',
            description='OCR confidence level.',
            es_mapping={'type': 'float'},
            search_filter=filters.RangeFilter(0, 100,
                                              description=(
                                                  'Accept only articles for which the Opitical Character Recognition confidence '
                                                  'indicator is in this range.'
                                              )
                                              ),
            extractor=extract.XML(tag='ocr', transform=float),
            sortable=True
        ),
        Field(
            name='date-end',
            display_name='Ending date',
            description=(
                'Ending date of publication. '
                'For issues that span more than 1 day.'
            ),
            extractor=extract.XML(
                tag='tdate', toplevel=True,
                applicable=after(1985)
            )
        ),
        # Field(indexed=False,
        #       name='weekday',
        #       display_name='Weekday',
        #       description='Day of the week.',
        #       extractor=extract.XML(
        #           tag='dw', toplevel=True,
        #           applicable=after(1985)
        #       )
        # ),
        Field(
            name='page-count',
            display_name='Image count',
            description='Page count: number of images present in the issue.',
            es_mapping={'type': 'integer'},
            extractor=extract.XML(
                tag='ip', toplevel=True, transform=int
            ),
            sortable=True
        ),
        # Field(indexed=False,
        #       name='copyright',
        #       display_name='Copyright',
        #       description='Copyright holder and year.',
        #       extractor=extract.Choice(
        #           extract.XML(
        #               tag='cp', toplevel=True,
        #               applicable=until(1985)
        #           ),
        #           extract.XML(
        #               tag='copyright', toplevel=True,
        #               applicable=after(1985)
        #           )
        #       )
        #       ),
        Field(
            name='page-type',
            display_name='Page type',
            description='Supplement in which article occurs.',
            es_mapping={'type': 'keyword'},
            search_filter=filters.MultipleChoiceFilter(
                description=(
                    'Accept only articles that occur in the relevant '
                    'supplement. Only after 1985.'
                ),
                option_count=2
            ),
            extractor=extract.XML(
                tag=['..', 'pageid'], attribute='isPartOf',
                applicable=after(1985)
            )
        ),
        Field(
            name='supplement-title',
            display_name='Supplement title',
            description='Supplement title.',
            extractor=extract.XML(
                tag=['..', 'pageid', 'supptitle'], multiple=True,
                applicable=after(1985)
            ),
        ),
        Field(
            name='supplement-subtitle',
            display_name='Supplement subtitle',
            description='Supplement subtitle.',
            extractor=extract.XML(
                tag=['..', 'pageid', 'suppsubtitle'], multiple=True,
                applicable=after(1985)
            )
        ),
        Field(
            name='cover',
            display_name='On front page',
            description='Whether the article is on the front page.',
            es_mapping={'type': 'boolean'},
            search_filter=filters.BooleanFilter(
                true='Front page',
                false='Other',
                description=(
                    'Accept only articles that are on the front page. '
                    'From 1985.'
                )
            ),
            extractor=extract.XML(
                tag=['..', 'pageid'], attribute='pageType',
                transform=string_contains("cover"),
                applicable=after(1985)
            )
        ),
        Field(
            name='id',
            display_name='ID',
            description='Article identifier.',
            extractor=extract.XML(tag='id')
        ),
        Field(
            name='ocr-relevant',
            display_name='OCR relevant',
            description='Whether OCR confidence level is relevant.',
            es_mapping={'type': 'boolean'},
            extractor=extract.XML(
                tag='ocr', attribute='relevant',
                transform=string_contains("yes"),
            )
        ),
        Field(
            name='column',
            display_name='Column',
            description=(
                'Starting column: a string to label the column'
                'where article starts.'
            ),
            extractor=extract.XML(tag='sc')
        ),
        Field(
            name='page',
            display_name='Page',
            description='Start page label, from source (1, 2, 17A, ...).',
            extractor=extract.Choice(
                extract.XML(tag='pa', applicable=until(1985)),
                extract.XML(tag=['..', 'pa'], applicable=after(1985))
            )
        ),
        Field(
            name='pages',
            display_name='Page count',
            es_mapping={'type': 'integer'},
            description=(
                'Page count: total number of pages containing sections '
                'of the article.'
            ),
            extractor=extract.XML(
                tag='pc', transform=int
            ),
            sortable=True
        ),
        Field(
            name='title',
            display_name='Title',
            results_overview=True,
            search_field_core=True,
            visualizations=['wordcloud'],
            description='Article title.',
            extractor=extract.XML(tag='ti')
        ),
        Field(
            name='subtitle',
            display_name='Subtitle',
            description='Article subtitle.',
            extractor=extract.XML(tag='ta', multiple=True),
            search_field_core=True
        ),
        Field(
            name='subheader',
            display_name='Subheader',
            description='Article subheader (product dependent field).',
            extractor=extract.XML(
                tag='subheader', multiple=True,
                applicable=after(1985)
            )
        ),
        Field(
            name='author',
            display_name='Author',
            description='Article author.',
            extractor=extract.Choice(
                extract.XML(
                    tag='au', multiple=True,
                    applicable=until(1985)
                ),
                extract.XML(
                    tag='au_composed', multiple=True,
                    applicable=after(1985)
                )
            ),
            search_field_core=True,
            csv_core=True
        ),
        Field(
            name='source-paper',
            display_name='Source paper',
            description='Credited as source.',
            extractor=extract.XML(
                tag='altSource', multiple=True
            )
        ),
        Field(
            name='category',
            visualizations=['resultscount', 'termfrequency'],
            display_name='Category',
            description='Article subject categories.',
            es_mapping={'type': 'keyword'},
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in these categories.',
                option_count=25
            ),
            extractor=extract.XML(tag='ct', multiple=True),
            csv_core=True
        ),
        Field(
            name='illustration',
            display_name='Illustration',
            description=(
                'Tables and other illustrations associated with the article.'
            ),
            es_mapping={'type': 'keyword'},
            visualizations=['resultscount', 'termfrequency'],
            search_filter=filters.MultipleChoiceFilter(
                description=(
                    'Accept only articles associated with these types '
                    'of illustrations.'),
                option_count=7
            ),
            extractor=extract.Choice(
                extract.XML(
                    tag='il', multiple=True,
                    applicable=until(1985)
                ),
                extract.XML(
                    tag='il', attribute='type', multiple=True,
                    applicable=after(1985)
                )
            ),
            csv_core=True
        ),
        Field(
            name='content-preamble',
            display_name='Content preamble',
            description='Raw OCR\'ed text (preamble).',
            extractor=extract.XML(
                tag=['text', 'text.preamble'],
                flatten=True
            )
        ),
        Field(
            name='content-heading',
            display_name='Content heading',
            description='Raw OCR\'ed text (header).',
            extractor=extract.XML(
                tag=['text', 'text.title'],
                flatten=True
            )
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            visualizations=['wordcloud'],
            description='Raw OCR\'ed text (content).',
            results_overview=True,
            search_field_core=True,
            extractor=extract.XML(
                tag=['text', 'text.cr'], multiple=True,
                flatten=True
            )
        ),
    ]

    document_context = {
        'context_fields': ['issue'],
        'sort_field': 'page',
        'sort_direction': 'asc',
        'context_display_name': 'issue'
    }

    def request_media(self, document):
        field_values = document['fieldValues']
        if 'image_path' in field_values:
            image_urls = [url_for(
                'api.api_get_media',
                corpus=self.es_index,
                image_path=field_values['image_path'],
                _external=True
            )]
        else: image_urls = []
        return {'media': image_urls }
