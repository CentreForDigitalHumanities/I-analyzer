#!/usr/bin/env python3

import config

import os, os.path, re, html, csv
from bs4      import BeautifulSoup
from datetime import datetime, timedelta

# Auxiliaries ##################################################################

regex1 = re.compile('(?<=\S)\n(?=\S)| +')
regex2 = re.compile('\n+')

def flatten(text):
    """
    Obtain flat text content from a soup node.
    """
    global regex1
    global regex2
    return html.unescape(regex2.sub('\n', regex1.sub(' ', text)).strip())


# Columns ######################################################################

class Column(object):
    tag = None

    def __init__(self, title = None):
        self.title = title or self.__class__.__name__

    def fromsoup(self, issue, article):
        raise NotImplementedError()

    @classmethod
    def columns(cls):
        for subclass in cls.__subclasses__():
            subs = subclass.__subclasses__()
            if not subs:
                yield subclass()
            else:
                for sub in subclass.columns():
                    yield sub


class IssueColumn(Column):
    def fromsoup(self, issue, article):
        if self.tag:
            node = issue.find(self.tag, recursive = False)
            if node:
                return flatten(node.get_text())
        else:
            raise NotImplementedError()


class ArticleColumn(Column):
    def fromsoup(self, issue, article):
        if self.tag:
            node = article.find(self.tag, recursive = False)
            if node:
                return flatten(node.get_text())
        else:
            raise NotImplementedError()


class Journal(IssueColumn):
    tag = "jn"

class Issue(IssueColumn):
    tag = "is"

class Date(IssueColumn):
    tag = "da"

class IP(IssueColumn): #?
    tag = "ip"

class Page(ArticleColumn):
    tag = "pa"

class ID(ArticleColumn):
    tag = "id"

class Category(ArticleColumn):
    tag = "ct"

class Format(ArticleColumn):
    tag = "il"

class OCRQuality(ArticleColumn):
    tag = "ocr"

class Author(ArticleColumn):
    tag = "au"

class Title(ArticleColumn):
    tag = "ti"

class TA(ArticleColumn): #?
    tag = "ta"

class PC(ArticleColumn): #?
    tag = "pc"

class SC(ArticleColumn): #?
    tag = "sc"

class Preamble(Column):
    def fromsoup(self, issue, article):
        node = article.find("text.preamble")
        if node:
            return flatten(node.get_text())

class Content(Column):
    def fromsoup(self, issue, article):
        node = article.find("text.cr")
        if node:
            return flatten(node.get_text())


################################################################################

def inspect(soup, max_content = 200):
    """
    Make an overview of some tags and their possible attributes & contents.
    """

    result = dict()
    for node in soup.descendants:
        tag = node.name
        if tag is not None and not tag in result:
            attrs = set()
            content = set()
            for node2 in soup.find_all(tag, limit = max_content):
                for k,v in node2.attrs.iteritems():
                    attrs.add("{}={}".format(k,v))
                for child in node2.children:
                    content.add("<{}>".format(child.name) if child.name else unicode(child.string))
            result[tag] = (list(attrs), list(content))
    return result



def datafiles(start, end):
    """
    Obtain an iterator of filesnames for the datafiles relevant to the given time period.
    """

    date = start
    delta = timedelta(days=1)
    while date <= end:
        infile = os.path.join(
            config.DATA_IN,
            date.strftime("%Y"),
            date.strftime("%Y%m%d"),
            date.strftime("0FFO-%Y-%b%d").upper() + ".xml"
        )
        outfile = os.path.join(
            config.DATA_OUT,
            date.strftime("%Y"),
            date.strftime("%Y%m%d")+".csv"
        )
        yield (date, infile, outfile)
        date += delta



def xml2csv(xmlfile, csvfile, columns):
    """
    Write the data obtained from soup to a csv with filename fn
    """

    # Obtain soup
    with open(xmlfile, "rb") as f:
        data = f.read()
    soup = BeautifulSoup(data, "lxml-xml")

    issue = soup.issue
    articles = issue.find_all("article", recursive = False) if issue else []

    # Create file
    if not os.path.isdir(os.path.dirname(csvfile)):
        os.makedirs(os.path.dirname(csvfile))

    with open(csvfile, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(col.title for col in columns)
        for article in articles:
            writer.writerow(col.fromsoup(issue, article) for col in columns)


def iter_csv(start, end, regenerate = True):
    """
    Obtain the CSV files that need to be read
    """

    for date, xmlfile, csvfile in datafiles(start, end):
        if not os.path.isfile(xmlfile):
            continue

        if regenerate or not os.path.isfile(csvfile):
            print("CSV file needs to be (re)generated. Now regenerating...")

            try:
                xml2csv(xmlfile, csvfile, list(Column.columns()))
            except:
                raise

        yield csvfile



def run(start, end):
    columns = [column.title for column in Column.columns()]

    yield ",".join(columns)
    for csvfile in iter_csv(start, end, regenerate = False):
        with open(csvfile, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                yield [row.get(col) for col in columns]


from datetime import datetime
run(datetime.strptime("1950-01-01", "%Y-%m-%d"), datetime.strptime("1950-12-31", "%Y-%m-%d"))