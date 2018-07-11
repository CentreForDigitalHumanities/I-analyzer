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

from ianalyzer import config_fallback as config
from ianalyzer import extract
from ianalyzer import filters
from ianalyzer.corpora.common import XMLCorpus, Field, until, after, string_contains


# Source files ################################################################


class Times(XMLCorpus):
    title = config.TIMES_TITLE
    description = config.TIMES_DESCRIPTION
    data_directory = config.TIMES_DATA
    min_date = config.TIMES_MIN_DATE
    max_date = config.TIMES_MAX_DATE
    es_index = config.TIMES_ES_INDEX
    es_doctype = config.TIMES_ES_DOCTYPE
    es_settings = None

    xml_tag_toplevel = 'issue'
    xml_tag_entry = 'article'

    def sources(self, start=datetime.min, end=datetime.max):
        '''
        Obtain source files for the Times data, relevant to the given timespan.

        Specifically, returns an iterator of tuples that each contain a string
        filename and a dictionary of metadata (in this case, the date).
        '''

        if isinstance(start, int):
            start = datetime(year=start, month=1, day=1)
        if isinstance(end, int):
            end = datetime(year=end, month=12, day=31)

        if start > end:
            tmp = start
            start = end
            end = tmp

        if start < self.min_date:
            start = self.min_date
        if end > self.max_date:
            end = self.max_date

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

    overview_fields = ['title', 'author',
                       'publication-date', 'journal', 'edition']

    fields = [
        Field(
            name='date',
            display_name='Date',
            description='Publication date, programmatically generated.',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            term_frequency=True,
            prominent_field=True,
            search_filter=filters.DateFilter(
                config.TIMES_MIN_DATE,
                config.TIMES_MAX_DATE,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=extract.Metadata('date',
                                       transform=lambda x: x.strftime(
                                           '%Y-%m-%d')
                                       )
        ),
        Field(indexed=False,
              name='issue-id',
              description='Issue identifier.',
              extractor=extract.XML(tag='id', toplevel=True)
              ),
        Field(indexed=False,
              name='journal',
              description='Journal name.',
              extractor=extract.XML(
                  tag='jn', toplevel=True,
                  applicable=until(1985)
              )
              ),
        Field(
            name='source',
            description='Library where the microfilm is sourced',
            extractor=extract.XML(
                tag=['metadatainfo', 'sourceLibrary'], toplevel=True,
                applicable=after(1985)
            )
        ),
        Field(indexed=False,
              name='newspaperID',
              description='Publication code',
              extractor=extract.XML(
                  tag=['metadatainfo', 'newspaperID'], toplevel=True,
                  applicable=after(1985)
              )
              ),
        Field(
            name='edition',
            extractor=extract.Choice(
                extract.XML(
                    tag='ed', toplevel=True,
                    applicable=until(1985)
                ),
                extract.XML(
                    tag='ed', toplevel=True, multiple=True,
                    applicable=after(1985)
                )
            )
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
            sortable=True
        ),
        Field(
            name='volume',
            description='Volume number.',
            extractor=extract.XML(
                tag='volNum', toplevel=True,
                applicable=after(1985)
            )
        ),
        Field(
            name='date-pub',
            description='Date of publication.',
            extractor=extract.XML(
                tag='da', toplevel=True
            )
        ),
        Field(
            name='date-end',
            description=(
                'Ending date of publication. '
                'For issues that span more than 1 day.'
            ),
            extractor=extract.XML(
                tag='tdate', toplevel=True,
                applicable=after(1985)
            )
        ),
        Field(indexed=False,
              name='weekday',
              description='Day of the week.',
              extractor=extract.XML(
                  tag='dw', toplevel=True,
                  applicable=after(1985)
              )
              ),
        Field(indexed=False,
              name='publication-date',
              description=(
                  'Fixed publication date. Logically generated from date, '
                  'e.g. yyyymmdd'
              ),
              extractor=extract.XML(
                  tag='pf', toplevel=True,
              )
              ),
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
        Field(indexed=False,
              name='copyright',
              description='Copyright holder and year.',
              extractor=extract.Choice(
                  extract.XML(
                      tag='cp', toplevel=True,
                      applicable=until(1985)
                  ),
                  extract.XML(
                      tag='copyright', toplevel=True,
                      applicable=after(1985)
                  )
              )
              ),
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
                options=[
                    'Special',
                    'Supplement',
                    'Standard'
                ]
            ),
            extractor=extract.XML(
                tag=['..', 'pageid'], attribute='isPartOf',
                applicable=after(1985)
            ),
            sortable=True
        ),
        Field(
            name='supplement-title',
            description='Supplement title.',
            extractor=extract.XML(
                tag=['..', 'pageid', 'supptitle'], multiple=True,
                applicable=after(1985)
            )
        ),
        Field(
            name='supplement-subtitle',
            description='Supplement subtitle.',
            extractor=extract.XML(
                tag=['..', 'pageid', 'suppsubtitle'], multiple=True,
                applicable=after(1985)
            )
        ),
        Field(
            name='cover',
            display_name='On cover',
            description='Whether the article is on the cover page.',
            es_mapping={'type': 'boolean'},
            search_filter=filters.BooleanFilter(
                true='Cover page',
                false='Other',
                description=(
                    'Accept only articles that are on the cover page. '
                    'From 1985.'
                )
            ),
            extractor=extract.XML(
                tag=['..', 'pageid'], attribute='pageType',
                transform=string_contains("cover"),
                applicable=after(1985)
            ),
            sortable=True
        ),
        Field(
            name='id',
            description='Article identifier.',
            extractor=extract.XML(tag='id')
        ),
        Field(
            name='ocr',
            display_name='OCR confidence',
            description='OCR confidence level.',
            es_mapping={'type': 'float'},
            search_filter=filters.RangeFilter(0, 100,
                                              description=(
                                                  'Accept only articles for which the OCR confidence '
                                                  'indicator is in this range.'
                                              )
                                              ),
            extractor=extract.XML(tag='ocr', transform=float),
            sortable=True
        ),
        Field(
            name='ocr-relevant',
            description='Whether OCR confidence level is relevant.',
            es_mapping={'type': 'boolean'},
            extractor=extract.XML(
                tag='ocr', attribute='relevant',
                transform=string_contains("yes"),
            )
        ),
        Field(
            name='column',
            description=(
                'Starting column: a string to label the column'
                'where article starts.'
            ),
            extractor=extract.XML(tag='sc')
        ),
        Field(
            name='page',
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
            prominent_field=True,
            description='Article title.',
            extractor=extract.XML(tag='ti')
        ),
        Field(
            name='subtitle',
            description='Article subtitle.',
            extractor=extract.XML(tag='ta', multiple=True)
        ),
        Field(
            name='subheader',
            description='Article subheader (product dependent field).',
            extractor=extract.XML(
                tag='subheader', multiple=True,
                applicable=after(1985)
            )
        ),
        Field(
            name='author',
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
            )
        ),
        Field(
            name='source-paper',
            description='Credited as source.',
            extractor=extract.XML(
                tag='altSource', multiple=True
            )
        ),
        Field(
            name='category',
            display_name='Category',
            term_frequency=True,
            description='Article subject categories.',
            es_mapping={'type': 'keyword'},
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in these categories.',
                options=[
                    'Classified Advertising',
                    'Display Advertising',
                    'Property',
                    'News',
                    'News in Brief',
                    'Index',
                    'Law',
                    'Politics and Parliament',
                    'Court and Social',
                    'Business and Finance',
                    'Shipping News',
                    'Stock Exchange Tables',
                    'Births',
                    'Business Appointments',
                    'Deaths',
                    'Marriages',
                    'Obituaries',
                    'Official Appointments and Notices',
                    'Editorials/Leaders',
                    'Feature Articles (aka Opinion)',
                    'Opinion',
                    'Letters to the Editor',
                    'Arts and Entertainment',
                    'Reviews',
                    'Sport',
                    'Weather'
                ]
            ),
            extractor=extract.XML(tag='ct', multiple=True),
            sortable=True
        ),
        Field(
            name='illustration',
            display_name='Illustration',
            description=(
                'Tables and other illustrations associated with the article.'
            ),
            es_mapping={'type': 'keyword'},
            term_frequency=True,
            search_filter=filters.MultipleChoiceFilter(
                description=(
                    'Accept only articles associated with these types '
                    'of illustrations.'),
                options=[
                    'Cartoon',
                    'Map',
                    'Drawing-Painting',
                    'Photograph',
                    'Graph',
                    'Table',
                    'Chart',
                    'Engraving',
                    'Fine-Art-Reproduction',
                    'Illustration'
                ]
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
            sortable=True
        ),
        Field(
            name='content-preamble',
            description='Raw OCR\'ed text (preamble).',
            extractor=extract.XML(
                tag=['text', 'text.preamble'],
                flatten=True
            )
        ),
        Field(
            name='content-heading',
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
            description='Raw OCR\'ed text (content).',
            prominent_field=True,
            extractor=extract.XML(
                tag=['text', 'text.cr'], multiple=True,
                flatten=True
            )
        ),
    ]
