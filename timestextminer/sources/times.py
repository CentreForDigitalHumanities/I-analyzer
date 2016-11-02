'''
Describes the structure of our database: how to obtain the files, how to read
the files and how they relate to ElasticSearch.
'''

import logging; logger = logging.getLogger(__name__)
import os
import os.path
import bs4
from datetime import datetime, timedelta

from .. import config
from .. import extractor
from .. import filters
from .common import Field


def until1985(date=None, **kw): # LTO_issue.dtd
    return date and date.year < 1986 


def after1985(date=None, **kw): # GALENP.dtd
    return date and date.year >= 1986 

fields = [
    Field(
        name='date',
        description='Associated date.',
        mapping={ 'type' : 'date' },
        sieve=filters.DateFilter(config.MIN_DATE, config.MAX_DATE, description='Accept only articles with a publication date in this range.'),
        extractor=lambda bowl, spoon, date=None: date
    ),
    Field(indexed=False,
        name='issue-id',
        description='Issue identifier.',
        extractor=extractor.string(tag='id', toplevel=True)
    ),
    Field(indexed=False,
        name='journal',
        description='Journal name.',
        extractor=[
            (until1985, extractor.string(tag='jn', toplevel=True))
        ]
    ),
    Field(
        name='source',
        description='Library where the microfilm is sourced',
        extractor=[
            (after1985, extractor.string(tag=['metadatainfo','sourceLibrary'], toplevel=True)),
        ]
    ),
    Field(
        name='newspaperID',
        indexed=False,
        description='Publication code',
        extractor=[
            (after1985, extractor.string(tag=['metadatainfo','newspaperID'], toplevel=True)),
        ]
    ),
    Field(
        name='edition',
        extractor=[
            (until1985, extractor.string(tag='ed', toplevel=True)),
            (after1985, extractor.string(tag='ed', toplevel=True, multiple=True)),
        ]
    ),
    Field(
        name='issue',
        description='Source issue number.',
        extractor=extractor.string(tag='is', toplevel=True)
    ),
    Field(
        name='volume',
        description='Volume number.',
        extractor=[
            (after1985, extractor.string(tag='volNum', toplevel=True))
        ]
    ),
    Field(
        name='date-pub',
        description='Publication date.',
        extractor=extractor.string(tag='da', toplevel=True)
    ),
    Field(
        name='date-end',
        description='Publication ending date. For issues that span more than 1 day.',
        extractor=[
            (after1985, extractor.string(tag='tdate', toplevel=True))
        ]
    ),
    Field(
        name='weekday',
        description='Day of the week.',
        indexed=False,
        extractor=[
            (after1985, extractor.string(tag='dw', toplevel=True))
        ]
    ),
    Field(
        name='publication-date',
        description='Fixed publication date. Logically generated from date, e.g. yyyymmdd',
        indexed=False,
        extractor=extractor.string(tag='pf', toplevel=True)
    ),
    Field(
        name='page-count',
        description='Page count; number of images present in the issue.',
        extractor=extractor.string(tag='ip', toplevel=True)
    ),
    Field(
        name='copyright',
        description='Copyright holder and year.',
        indexed=False,
        extractor=[
            (until1985, extractor.string(tag='cp', toplevel=True)),
            (after1985, extractor.string(tag='copyright', toplevel=True))
        ]
    ),
    Field(
        name='page-type',
        description='On what supplement does the article occur?',
        options=['Special','Supplement','Standard'],
        extractor=[
            (after1985, extractor.attr(tag=['..','pageid'], attr='isPartOf'))
        ]
    ),
    Field(
        name='supplement-title',
        description='Supplement title',
        extractor=[
            (after1985, extractor.string(tag=['..','pageid','supptitle'], multiple=True))
        ]
    ),
    Field(
        name='supplement-subtitle',
        description='Supplement subtitle',
        extractor=[
            (after1985, extractor.string(tag=['..','pageid','suppsubtitle'], multiple=True))
        ]
    ),
    Field(
        name='cover',
        description='Whether the article is on the cover page.',
        options=[False,True],
        extractor=[
            (after1985, extractor.attr(tag=['..','pageid'], attr='pageType', transform=lambda s:bool("Cover" in s if s else False)))
        ]
    ),
    Field(
        name='id',
        description='Article identifier.',
        extractor=extractor.string(tag='id')
    ),
    Field(
        name='ocr',
        description='OCR confidence level.',
        mapping={ 'type' : 'double' },
        extractor=extractor.string(tag='ocr', transform=float),
        sieve=filters.RangeFilter('ocr', 0, 100, description='Accept only articles for which the OCR confidence indicator is in this range.'),
    ),
    Field(
        name='ocr-relevant',
        description='Whether OCR confidence level is relevant.',
        mapping={ 'type' : 'boolean' },
        options=[False, True],
        extractor=extractor.attr(tag='ocr', attr='relevant', transform=lambda s:bool("yes" in s if s else False))
    ),
    Field(
        name='column',
        description='Starting column: a string to label the column where article starts',
        extractor=extractor.string(tag='sc')
    ),
    Field(
        name='page',
        description='Page start: source page label (1, 2, 17A, ...)',
        extractor=[
            (until1985, extractor.string(tag='pa')),
            (after1985, extractor.string(tag=['..','pa']))
        ]
    ),
    Field(
        name='pages',
        description='Page count: total number of pages containing sections of the article',
        extractor=extractor.string(tag='pc')
    ),
    Field(
        name='title',
        extractor=extractor.string(tag='ti')
    ),
    Field(
        name='subtitle',
        extractor=extractor.string(tag='ta', multiple=True)
    ),
    Field(
        name='subheader',
        description='Product dependent field',
        extractor=[
            (after1985, extractor.string(tag='subheader', multiple=True))
        ]
    ),
    Field(
        name='author',
        extractor=[
            (until1985, extractor.string(tag='au', multiple=True)),
            (after1985, extractor.string(tag='au_composed', multiple=True))
        ]
    ),
    Field(
        name='source-paper',
        description='Source paper',
        extractor=extractor.string(tag='altSource', multiple=True)
    ),
    Field(
        name='category',
        description='Article subject categories.',
        mapping={ 'type': 'string', 'index' : 'not_analyzed' },
        sieve=filters.MultipleChoiceFilter('category', description='Accept only articles in these categories.', options=['Classified Advertising','Display Advertising','Property','News','News In Brief','Index','Law','Politics and Parliament', 'Court and Social','Business and Finance','Shipping News','Stock Exchange Tables','Births','Business Appointments','Deaths','Marriages','Obituaries','Official Appointments and Notices','Editorials/Leaders','Feature Articles','Opinion','Letters to the Editor','Arts and Entertainment','Reviews','Sport','Weather']),
        extractor=extractor.string(tag='ct', multiple=True)
    ),
    Field(
        name='illustration',
        mapping={ 'type': 'string', 'index' : 'not_analyzed' },
        sieve=filters.MultipleChoiceFilter('illustration', description='Accept only articles associated with these illustrations.', options=['Cartoon', 'Map', 'Drawing-Painting', 'Photograph', 'Graph', 'Table', 'Chart', 'Engraving', 'Fine-Art-Reproduction', 'Illustration']),
        extractor=[
            (until1985, extractor.string(tag='il', multiple=True)),
            (after1985, extractor.attr(tag='il', attr='type', multiple=True))
        ]
    ),
    Field(
        name='content-preamble',
        extractor=extractor.flatten(tag=['text','text.preamble'])
    ),
    Field(
        name='content-heading',
        extractor=extractor.flatten(tag=['text','text.title'])
    ),
    Field(
        name='content',
        extractor=extractor.flatten(tag=['text','text.cr'], multiple=True)
    ),
#    Field(
#        name='mcode',
#        extractor=[
#            (until1985, extractor.string(tag='ba', toplevel=True))
#        ]
#    ),
#    Field(name='page-image',
#        extractor=extractor.string(tag='pi',multiple=True)) #pgref?
#    ),
#    Field(name='clipped-article', description='Clipped article image',
#       extractor=extractor.string(tag='ci', multiple=True)) #pgref? clip?
#    ),
]

def files(start=datetime.min, end=datetime.max):
    '''
    Obtain an iterator of dates and filenames corresponding to the data files
    that are relevant to the given period of time.
    '''

    if isinstance(start, int):
        start = datetime(year=start, month=1, day=1)
    if isinstance(end, int):
        end = datetime(year=end, month=12, day=31)

    if start > end:
        tmp = start
        start = end
        end = tmp

    if start < config.MIN_DATE:
        start = config.MIN_DATE
    if end > config.MAX_DATE:
        end = config.MAX_DATE

    date = start
    delta = timedelta(days = 1)
    while date <= end:

        # Construct the tag to the correct directory
        xmldir = os.path.join(*[
            config.DATA,
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



def _xml2dicts(xmlfile, **meta):
    '''
    Generate document dictionaries from the given XML file.
    '''

    logger.debug('Reading XML file {} ...'.format(xmlfile))

    # Obtain soup from XML
    with open(xmlfile, 'rb') as f:
        data = f.read()
    bowl = bs4.BeautifulSoup(data, 'lxml-xml')

    # Extract fields from soup
    global fields
    date = meta.get('date')
    try:
        issue = (
            bowl.issue
                if date and date.year <= 1985 else
            bowl.GALENP.Newspaper.issue
        )
    except AttributeError:
        raise
    else:
        if issue:
            for article in issue.find_all('article'):
                yield {
                    field.name :
                    (field.extractor(**meta))(issue, article, **meta)
                    for field in fields if field.indexed
                }



def documents(datafiles):
    '''
    Generate document dictionaries from all relevant XML files.
    '''

    return (document
        for xmlfile, metadata in datafiles
            for document in _xml2dicts(xmlfile, **metadata)
    )
