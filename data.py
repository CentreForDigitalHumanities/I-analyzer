'''
Extraction of Times-data from XML files.
'''

import os
import os.path
import logging; logger = logging.getLogger(__name__)
import bs4
from datetime import datetime, timedelta

import config
from fields import Field
import extractor



def until1985(date=None, **kw): # LTO_issue.dtd
    return date and date.year < 1986 


def after1985(date=None, **kw): # GALENP.dtd
    return date and date.year >= 1986 


fields = [
    Field(
        name='id',
        description='Issue identifier.',
        extractor=[
            (until1985, extractor.stringify(path='issue > id', toplevel=True))
        ]
    ),
    Field(
        name='journal',
        description='Journal name.',
        extractor=[
            (until1985, extractor.stringify(path='issue > jn', toplevel=True))
        ]
    ),
#    Field(
#        name='mcode',
#        extractor=[
#            (until1985, extractor.stringify(path='issue > ba', toplevel=True))
#        ]
#    ),
    Field(
        name='edition',
        extractor=[
            (until1985, extractor.stringify(path='issue > ed', toplevel=True))
        ]
    ),
    Field(
        name='issue',
        description='Source issue number.',
        extractor=[
            (until1985, extractor.stringify(path='issue > is', toplevel=True))
        ]
    ),
    Field(
        name='date',
        extractor=[
            (until1985, extractor.stringify(path='issue > da', toplevel=True))
        ]
    ),
    Field(
        name='publication',
        description='Fixed publication date.',
        extractor=[
            (until1985, extractor.stringify(path='issue > pf', toplevel=True))
        ]
    ),
    Field(
        name='page-count',
        extractor=[
            (until1985, extractor.stringify(path='issue > ip', toplevel=True))
        ]
    ),
    Field(
        name='copyright',
        description='Copyright holder and year.',
        extractor=[
            (until1985, extractor.stringify(path='issue > cp', toplevel=True))
        ]
    ),
    Field(
        name='id',
        description='Article identifier',
        extractor=[
            (until1985, extractor.stringify(path='id'))
        ]
    ),
    Field(
        name='ocr', querent=None,
        description='OCR confidence level.',
        extractor=[
            (until1985, extractor.stringify(path='ocr'))
        ]
    ),
    Field(
        name='column',
        description='Starting column: a string to label the column where article starts',
        extractor=[
            (until1985, extractor.stringify(path='sc'))
        ]
    ),
#    Field(name='page-image',
#        (until1985, CompositeExtractor(path='pi')) #pgref?
#    ),
#    Field(name='clipped-article', description='Clipped article image',
#        (until1985, CompositeExtractor(path='ci')) #pgref? clip?
#    ),
    Field(
        name='page',
        description='Page start: source page label (1, 2, 17A, ...)',
        extractor=[
            (until1985, extractor.stringify(path='pa'))
        ]
    ),
    Field(
        name='pages',
        description='Page count: total number of pages containing sections of the article',
        extractor=[
            (until1985, extractor.stringify(path='pc'))
        ]
    ),
    Field(
        name='title',
        extractor=[
            (until1985, extractor.stringify(path='ti'))
        ]
    ),
    Field(
        name='subtitle',
        extractor=[
            (until1985, extractor.stringify(path='ta', multiple=True))
        ]
    ),
    Field(
        name='author',
        extractor=[
            (until1985, extractor.stringify(path='au', multiple=True))
        ]
    ),
    Field(
        name='source-paper',
        description='Source paper',
        extractor=[
            (until1985, extractor.stringify(path='altSource'))
        ]
    ),
    Field(
        name='category',
        description='uses predefined list of article subject categories in specification',
        extractor=[
            (until1985, extractor.stringify(path='ct', multiple=True))
        ]
    ),
    Field(
        name='illustration',
        extractor=[
            (until1985, extractor.stringify(path='il', multiple=True))
        ]
    ),
    Field(
        name='preamble',
        extractor=[
            (until1985, extractor.flatten(path='text > text.preamble'))
        ]
    ),
    Field(
        name='heading',
        extractor=[
            (until1985, extractor.flatten(path='text > text.title'))
        ]
    ),
    Field(
        name='content',
        extractor=[
            (until1985, extractor.flatten(path='text > text.cr'))
        ]
    ),
]



def datafiles(start=datetime.min, end=datetime.max):
    '''
    Obtain an iterator of dates and filenames corresponding to the data files
    that are relevant to the given period of time.
    '''

    if start > end:
        tmp = start
        start = end
        end = tmp

    if isinstance(start, int):
        start = datetime(year=start, month=1, day=1)
    if isinstance(end, int):
        end = datetime(year=end, month=12, day=31)

    if start < config.MIN_DATE:
        start = config.MIN_DATE
    if end > config.MAX_DATE:
        end = config.MAX_DATE

    date = start
    delta = timedelta(days = 1)
    while date <= end:

        # Construct the path to the correct directory
        xmldir = os.path.join(*([
            config.DATA,
            'TDA_GDA'
        ] + (
            ['TDA_2010']
                if date.year == 2010 else
            ['TDA_GDA_1785-2009', date.strftime('%Y')]
        )))

        # Skip this year if its directory doesn't exist
        if not os.path.isdir(xmldir):
            logger.warning('Directory {} does not exist'.format(xmldir))
            date = datetime(year=date.year+1, month=1, day=1)
            continue

        # Construct the full path
        xmlfile = os.path.join(
            xmldir,
            date.strftime('%Y%m%d'), 
            date.strftime('0FFO-%Y-%m%d.xml') \
                if date.year > 1985 else \
            date.strftime('0FFO-%Y-%b%d').upper() + '.xml' 
        )

        # Yield date and path if the desired file is present
        if os.path.isfile(xmlfile):
            yield (date, xmlfile)
        else:
            logger.warning('XML file {} does not exist'.format(xmlfile))

        date += delta



def xml2dicts(xmlfile, **meta):
    '''
    Generate document dictionaries from the given XML file.
    '''

    logger.info('Reading XML file {} ...'.format(xmlfile))

    # Obtain soup from XML
    with open(xmlfile, 'rb') as f:
        data = f.read()
    bowl = bs4.BeautifulSoup(data, 'lxml-xml')

    # Extract fields from soup
    global fields
    issue = bowl.find('issue')
    if issue:
        for spoon in issue.find_all('article', recursive=False):
            yield {
                field.name: (field.extractor(**meta))(bowl, spoon)
                for field in fields
            }


def documents(dates_and_files=None):
    '''
    Generate document dictionaries from all relevant XML files.
    '''

    dates_and_files = dates_and_files or datafiles()

    return (document
        for date, xmlfile in dates_and_files
            for document in xml2dicts(xmlfile, date=date)
    )
