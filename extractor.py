'''
Extraction of Times-data from XML files.
'''

import os
import os.path
import logging; logger = logging.getLogger(__name__)
from bs4 import BeautifulSoup
from datetime import datetime, timedelta

import config

def filenames(directory=config.DATA, start=datetime.min, end=datetime.max):
    '''
    Obtain an iterator of filenames for the datafiles relevant to the given
    time period.
    '''

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

        # Construct the path to the correct directory
        xmldir = os.path.join(*([
            directory,
            'TDA_GDA'
        ] + (
            ['TDA_2010']
                if date.year == 2010 else
            ['TDA_GDA_1785-2009', date.strftime('%Y')]
        )))

        # Skip if not existing
        if not os.path.isdir(xmldir):
            logger.warning('Directory {} does not exist'.format(xmldir))
            date = datetime(year = date.year+1, month = 1, day = 1)
            continue

        # Construct the full path
        xmlfile = os.path.join(
            xmldir,
            date.strftime('%Y%m%d'), 
            date.strftime('0FFO-%Y-%m%d.xml') \
                if date.year > 1985 else \
            date.strftime('0FFO-%Y-%b%d').upper() + '.xml' 
        )

        # Catch or yield
        if os.path.isfile(xmlfile):
            yield (date, xmlfile)
        else:
            logger.warning('XML file {} does not exist'.format(xmlfile))

        date += delta



def xml2dicts(xmlfile, fields):
    '''
    Generate document dictionaries from the given XML file. `fields` contains
    the extractor objects.
    '''

    logger.info('Reading XML file {} ...'.format(xmlfile))

    # Obtain soup from XML
    with open(xmlfile, 'rb') as f:
        data = f.read()
    soup = BeautifulSoup(data, 'lxml-xml')

    # Extract fields from soup
    issue = soup.issue
    if issue:
        for article in issue.find_all('article', recursive=False):
            yield {
                field.name : field.from_soup(issue, article)
                for field in fields
            }



def dicts(fields, filenames):
    '''
    Generate document dictionaries from all relevant XML files. `fields`
    contains the extractor objects.
    '''

    return (document
        for date, xmlfile in filenames
            for document in xml2dicts(xmlfile, fields)
    )