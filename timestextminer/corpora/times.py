'''
Collect corpus-specific information, that is, data structures and file
locations.

Until 1985, the XML structure of Times-data is described by `LTO_issue.dtd`.
After 1985, it is described by `GALENP.dtd`.
'''

import logging; logger = logging.getLogger(__name__)
import os
import os.path
from datetime import datetime, timedelta

from .. import config
from .. import extract
from .. import filters
from .common import XMLCorpus, Field, until, after, default


class mapping:
    keyword = { 'type' : 'keyword' }
    multi_keyword = { 'type' : 'keyword' }
    date = { 'type' : 'date', 'format': 'yyyy-MM-dd' }
    boolean = { 'type' : 'boolean' }
    float = { 'type' : 'float' }
    int = { 'type' : 'integer' }


# Source files ################################################################


class Times(XMLCorpus):

    DATA = config.TIMES_DATA
    ES_INDEX = config.TIMES_ES_INDEX
    ES_DOCTYPE = config.TIMES_ES_DOCTYPE
    MIN_DATE = config.TIMES_MIN_DATE
    MAX_DATE = config.TIMES_MAX_DATE
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

        if start < self.MIN_DATE:
            start = self.MIN_DATE
        if end > self.MAX_DATE:
            end = self.MAX_DATE

        date = start
        delta = timedelta(days = 1)
        while date <= end:

            # Construct the tag to the correct directory
            xmldir = os.path.join(*[
                self.DATA,
                'TDA_GDA'
            ] + (
                ['TDA_2010']
                    if date.year == 2010 else
                ['TDA_GDA_1785-2009', date.strftime('%Y')]
            ))

            # Skip this year if its directory doesn't exist
            if not os.path.isdir(xmldir):
                logger.warning('Directory {} does not exist'.format(xmldir))
                date = datetime(year=date.year+1, month=1, day=1)
                continue

            # Construct the full tag
            xmlfile = os.path.join(
                xmldir,
                date.strftime('%Y%m%d'), 
                date.strftime('0FFO-%Y-%m%d.xml') \
                    if date.year > 1985 else \
                date.strftime('0FFO-%Y-%b%d').upper() + '.xml' 
            )

            # Yield file and metadata if the desired file is present
            if os.path.isfile(xmlfile):
                yield (xmlfile, { 'date' : date })
            else:
                logger.warning('XML file {} does not exist'.format(xmlfile))

            date += delta



    fields = [
        Field(
            name='date',
            description='Publication date, programmatically generated.',
            mapping=mapping.date,
            filter_=filters.DateFilter('date', config.TIMES_MIN_DATE, config.TIMES_MAX_DATE, description='Accept only articles with a publication date in this range.'),
            extractor=[
                (default, extract.meta('date', transform=lambda x: x.strftime('%Y-%m-%d'))),
            ]
        ),
        Field(indexed=False,
            name='issue-id',
            description='Issue identifier.',
            extractor=[
                (default, extract.string(tag='id', toplevel=True)),
            ]
        ),
        Field(indexed=False,
            name='journal',
            description='Journal name.',
            extractor=[
                (until(1985), extract.string(tag='jn', toplevel=True))
            ]
        ),
        Field(
            name='source',
            description='Library where the microfilm is sourced',
            extractor=[
                (after(1985), extract.string(tag=['metadatainfo','sourceLibrary'], toplevel=True)),
            ]
        ),
        Field(
            name='newspaperID',
            indexed=False,
            description='Publication code',
            extractor=[
                (after(1985), extract.string(tag=['metadatainfo','newspaperID'], toplevel=True)),
            ]
        ),
        Field(
            name='edition',
            extractor=[
                (until(1985), extract.string(tag='ed', toplevel=True)),
                (after(1985), extract.string(tag='ed', toplevel=True, multiple=True)),
            ]
        ),
        Field(
            name='issue',
            mapping=mapping.int,
            description='Source issue number.',
            extractor=[
                (default, extract.string(tag='is', toplevel=True, transform=lambda x: (62226 if x=="6222662226" else int(x)))) # Hardcoded to ignore one particular issue with source data
            ]
        ),
        Field(
            name='volume',
            description='Volume number.',
            extractor=[
                (after(1985), extract.string(tag='volNum', toplevel=True))
            ]
        ),
        Field(
            name='date-pub',
            description='Date of publication.',
            extractor=[
                (default, extract.string(tag='da', toplevel=True))
            ]
        ),
        Field(
            name='date-end',
            description='Ending date of publication. For issues that span more than 1 day.',
            extractor=[
                (after(1985), extract.string(tag='tdate', toplevel=True))
            ]
        ),
        Field(
            name='weekday',
            description='Day of the week.',
            indexed=False,
            extractor=[
                (after(1985), extract.string(tag='dw', toplevel=True))
            ]
        ),
        Field(
            name='publication-date',
            description='Fixed publication date. Logically generated from date, e.g. yyyymmdd',
            indexed=False,
            extractor=[
                (default, extract.string(tag='pf', toplevel=True)),
            ]
        ),
        Field(
            name='page-count',
            description='Page count: number of images present in the issue.',
            mapping={ 'type' : 'integer' },
            extractor=[
                (default, extract.string(tag='ip', toplevel=True, transform=int))
            ]
        ),
        Field(
            name='copyright',
            description='Copyright holder and year.',
            indexed=False,
            extractor=[
                (until(1985), extract.string(tag='cp', toplevel=True)),
                (after(1985), extract.string(tag='copyright', toplevel=True))
            ]
        ),
        Field(
            name='page-type',
            description='Supplement in which article occurs.',
            mapping=mapping.keyword,
            filter_=filters.MultipleChoiceFilter('page-type',
                description='Accept only articles that occur in the relevant supplement. Only after 1985.',
                options=['Special','Supplement','Standard']
            ),
            extractor=[
                (after(1985), extract.attr(tag=['..','pageid'], attr='isPartOf'))
            ]
        ),
        Field(
            name='supplement-title',
            description='Supplement title.',
            extractor=[
                (after(1985), extract.string(tag=['..','pageid','supptitle'], multiple=True))
            ]
        ),
        Field(
            name='supplement-subtitle',
            description='Supplement subtitle.',
            extractor=[
                (after(1985), extract.string(tag=['..','pageid','suppsubtitle'], multiple=True))
            ]
        ),
        Field(
            name='cover',
            description='Whether the article is on the cover page.',
            mapping=mapping.boolean,
            filter_=filters.BooleanFilter('cover', true='Cover page', false='Other', description='Accept only articles that are on the cover page. From 1985.'),
            extractor=[
                (after(1985), extract.attr(tag=['..','pageid'], attr='pageType', transform=lambda s:bool("Cover" in s if s else False)))
            ]
        ),
        Field(
            name='id',
            description='Article identifier.',
            extractor=[
                (default, extract.string(tag='id'))
            ]
        ),
        Field(
            name='ocr',
            description='OCR confidence level.',
            mapping=mapping.float,
            filter_=filters.RangeFilter('ocr', 0, 100, description='Accept only articles for which the OCR confidence indicator is in this range.'),
            extractor=[
                (default, extract.string(tag='ocr', transform=float)),
            ]
        ),
        Field(
            name='ocr-relevant',
            description='Whether OCR confidence level is relevant.',
            mapping=mapping.boolean,
            extractor=[
                (default, extract.attr(tag='ocr', attr='relevant', transform=lambda s:bool("yes" in s.lower() if s else False)))
            ]
        ),
        Field(
            name='column',
            description='Starting column: a string to label the column where article starts.',
            extractor=[
                (default, extract.string(tag='sc'))
            ]
        ),
        Field(
            name='page',
            description='Start page label, from source (1, 2, 17A, ...).',
            extractor=[
                (until(1985), extract.string(tag='pa')),
                (after(1985), extract.string(tag=['..','pa']))
            ]
        ),
        Field(
            name='pages',
            mapping=mapping.int,
            description='Page count: total number of pages containing sections of the article.',
            extractor=[
                (default, extract.string(tag='pc', transform=int))
            ]
        ),
        Field(
            name='title',
            description='Article title.',
            extractor=[
                (default, extract.string(tag='ti'))
            ]
        ),
        Field(
            name='subtitle',
            description='Article subtitle.',
            extractor=[
                (default, extract.string(tag='ta', multiple=True))
            ]
        ),
        Field(
            name='subheader',
            description='Article subheader (product dependent field).',
            extractor=[
                (after(1985), extract.string(tag='subheader', multiple=True))
            ]
        ),
        Field(
            name='author',
            description='Article author.',
            extractor=[
                (until(1985), extract.string(tag='au', multiple=True)),
                (after(1985), extract.string(tag='au_composed', multiple=True))
            ]
        ),
        Field(
            name='source-paper',
            description='Credited as source.',
            extractor=[
                (default, extract.string(tag='altSource', multiple=True))
            ]
        ),
        Field(
            name='category',
            description='Article subject categories.',
            mapping=mapping.multi_keyword,
            filter_=filters.MultipleChoiceFilter('category',
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
            extractor=[
                (default, extract.string(tag='ct', multiple=True))
            ]
        ),
        Field(
            name='illustration',
            description='Tables and other illustrations associated with the article.',
            mapping=mapping.multi_keyword,
            filter_=filters.MultipleChoiceFilter('illustration',
                description='Accept only articles associated with these types of illustrations.', 
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
            extractor=[
                (until(1985), extract.string(tag='il', multiple=True)),
                (after(1985), extract.attr(tag='il', attr='type', multiple=True))
            ]
        ),
        Field(
            name='content-preamble',
            description='Raw OCR\'ed text (preamble).',
            extractor=[
                (default, extract.flatten(tag=['text','text.preamble']))
            ]
        ),
        Field(
            name='content-heading',
            description='Raw OCR\'ed text (header).',
            extractor=[
                (default, extract.flatten(tag=['text','text.title']))
            ]
        ),
        Field(
            name='content',
            description='Raw OCR\'ed text (content).',
            extractor=[
                (default, extract.flatten(tag=['text','text.cr'], multiple=True))
            ]
        ),
    ]
