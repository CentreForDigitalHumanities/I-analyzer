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
from .common import Field, until, after, xml2dicts


# Corpus-specific config ######################################################

# ElasticSearch index
ES_INDEX='times-test'
ES_DOCTYPE='article'

# Path to directory containing XML files (prior to indexing)
DATA = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..', 'data-test'))

# Date range of available data
MIN_DATE = datetime(year=1785, month=1, day=1) 
MAX_DATE = datetime(year=2010, month=12, day=31)


# Data structure ##############################################################
#
# `fields` collects filters, extractor functions, etcetera that are relevant
# to each data field. Specific to the current database.

fields = [
    Field(
        name='date',
        description='Associated date.',
        mapping={ 'type' : 'date' },
        filter_=filters.DateFilter(MIN_DATE, MAX_DATE, description='Accept only articles with a publication date in this range.'),
        extractor=extract.meta('date')
    ),
    Field(indexed=False,
        name='issue-id',
        description='Issue identifier.',
        extractor=extract.string(tag='id', toplevel=True)
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
        description='Source issue number.',
        extractor=extract.string(tag='is', toplevel=True)
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
        description='Publication date.',
        extractor=extract.string(tag='da', toplevel=True)
    ),
    Field(
        name='date-end',
        description='Publication ending date. For issues that span more than 1 day.',
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
        extractor=extract.string(tag='pf', toplevel=True)
    ),
    Field(
        name='page-count',
        description='Page count; number of images present in the issue.',
        extractor=extract.string(tag='ip', toplevel=True)
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
        description='On what supplement does the article occur?',
        options=['Special','Supplement','Standard'],
        extractor=[
            (after(1985), extract.attr(tag=['..','pageid'], attr='isPartOf'))
        ]
    ),
    Field(
        name='supplement-title',
        description='Supplement title',
        extractor=[
            (after(1985), extract.string(tag=['..','pageid','supptitle'], multiple=True))
        ]
    ),
    Field(
        name='supplement-subtitle',
        description='Supplement subtitle',
        extractor=[
            (after(1985), extract.string(tag=['..','pageid','suppsubtitle'], multiple=True))
        ]
    ),
    Field(
        name='cover',
        description='Whether the article is on the cover page.',
        options=[False,True],
        extractor=[
            (after(1985), extract.attr(tag=['..','pageid'], attr='pageType', transform=lambda s:bool("Cover" in s if s else False)))
        ]
    ),
    Field(
        name='id',
        description='Article identifier.',
        extractor=extract.string(tag='id')
    ),
    Field(
        name='ocr',
        description='OCR confidence level.',
        mapping={ 'type' : 'double' },
        extractor=extract.string(tag='ocr', transform=float),
        filter_=filters.RangeFilter('ocr', 0, 100, description='Accept only articles for which the OCR confidence indicator is in this range.'),
    ),
    Field(
        name='ocr-relevant',
        description='Whether OCR confidence level is relevant.',
        mapping={ 'type' : 'boolean' },
        options=[False, True],
        extractor=extract.attr(tag='ocr', attr='relevant', transform=lambda s:bool("yes" in s if s else False))
    ),
    Field(
        name='column',
        description='Starting column: a string to label the column where article starts',
        extractor=extract.string(tag='sc')
    ),
    Field(
        name='page',
        description='Page start: source page label (1, 2, 17A, ...)',
        extractor=[
            (until(1985), extract.string(tag='pa')),
            (after(1985), extract.string(tag=['..','pa']))
        ]
    ),
    Field(
        name='pages',
        description='Page count: total number of pages containing sections of the article',
        extractor=extract.string(tag='pc')
    ),
    Field(
        name='title',
        extractor=extract.string(tag='ti')
    ),
    Field(
        name='subtitle',
        extractor=extract.string(tag='ta', multiple=True)
    ),
    Field(
        name='subheader',
        description='Product dependent field',
        extractor=[
            (after(1985), extract.string(tag='subheader', multiple=True))
        ]
    ),
    Field(
        name='author',
        extractor=[
            (until(1985), extract.string(tag='au', multiple=True)),
            (after(1985), extract.string(tag='au_composed', multiple=True))
        ]
    ),
    Field(
        name='source-paper',
        description='Source paper',
        extractor=extract.string(tag='altSource', multiple=True)
    ),
    Field(
        name='category',
        description='Article subject categories.',
        mapping={ 'type': 'string', 'index' : 'not_analyzed' },
        filter_=filters.MultipleChoiceFilter('category', description='Accept only articles in these categories.', options=['Classified Advertising','Display Advertising','Property','News','News In Brief','Index','Law','Politics and Parliament', 'Court and Social','Business and Finance','Shipping News','Stock Exchange Tables','Births','Business Appointments','Deaths','Marriages','Obituaries','Official Appointments and Notices','Editorials/Leaders','Feature Articles','Opinion','Letters to the Editor','Arts and Entertainment','Reviews','Sport','Weather']),
        extractor=extract.string(tag='ct', multiple=True)
    ),
    Field(
        name='illustration',
        mapping={ 'type': 'string', 'index' : 'not_analyzed' },
        filter_=filters.MultipleChoiceFilter('illustration', description='Accept only articles associated with these illustrations.', options=['Cartoon', 'Map', 'Drawing-Painting', 'Photograph', 'Graph', 'Table', 'Chart', 'Engraving', 'Fine-Art-Reproduction', 'Illustration']),
        extractor=[
            (until(1985), extract.string(tag='il', multiple=True)),
            (after(1985), extract.attr(tag='il', attr='type', multiple=True))
        ]
    ),
    Field(
        name='content-preamble',
        extractor=extract.flatten(tag=['text','text.preamble'])
    ),
    Field(
        name='content-heading',
        extractor=extract.flatten(tag=['text','text.title'])
    ),
    Field(
        name='content',
        extractor=extract.flatten(tag=['text','text.cr'], multiple=True)
    ),
]



# Source files ################################################################

def files(start=datetime.min, end=datetime.max, **kwargs):
    '''
    Obtain filenames of XML-data for the Times, relevant to the given timespan.
    
    More abstractly, returns an iterator of tuples that contain a filename and
    a dictionary of associated metadata.
    '''

    if isinstance(start, int):
        start = datetime(year=start, month=1, day=1)
    if isinstance(end, int):
        end = datetime(year=end, month=12, day=31)

    if start > end:
        tmp = start
        start = end
        end = tmp

    if start < MIN_DATE:
        start = MIN_DATE
    if end > MAX_DATE:
        end = MAX_DATE

    date = start
    delta = timedelta(days = 1)
    while date <= end:

        # Construct the tag to the correct directory
        xmldir = os.path.join(*[
            DATA,
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

        # Yield date and tag if the desired file is present
        if os.path.isfile(xmlfile):
            yield (xmlfile, { 'date' : date })
        else:
            logger.warning('XML file {} does not exist'.format(xmlfile))

        date += delta



# Wrapping up #################################################################

def documents(datafiles):
    '''
    From the result type of files(), generate an iterator of document
    dictionaries.
    '''

    return (document
        for filename, metadata in datafiles
            for document in xml2dicts(
                fields,
                tag_top='issue',
                tag_entry='article',
                xmlfile=filename,
                metadata=metadata
            )
    )
