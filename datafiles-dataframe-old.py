#!/usr/bin/env python

import config

import os, os.path, re, nltk, string, pandas as pd
from HTMLParser import HTMLParser
from lxml import etree
from bs4 import BeautifulSoup

# Auxiliaries ##################################################################

html = HTMLParser()
regex1 = re.compile('(?<=\S)\n(?=\S)| +')
regex2 = re.compile('\n+')

def flatten(text):
    """
    Obtain flat text content from a soup node.
    """

    return html.unescape(regex2.sub('\n', regex1.sub(' ', text)).strip())


# Columns ######################################################################

class Column(object):
    tag = None
    hidden = False

    def __init__(self, title = None):
        self.title = title or self.__class__.__name__

    def get(self, soup):
        if self.tag:
            node = soup.find(self.tag)
            if node:
                return flatten(node.get_text())
        else:
            raise NotImplementedError()

    @classmethod
    def columns(cls):
        """
        Return only implementation columns (the leaves of the subclass tree)
        """
        for subclass in cls.__subclasses__():
            if subclass.hidden:
                continue
            subsubclasses = subclass.__subclasses__()
            if not subsubclasses:
                yield subclass
            else:
                for subsubclass in subclass.columns():
                    yield subsubclass


    @classmethod
    def from_name(cls, string):
        for col in cls.columns():
            if string.lower() == col.__name__.lower():
                return col
        raise RuntimeError("Unrecognised column name")

class Journal(Column): 
    tag = "jn"

class Issue(Column):
    tag = "is"

class Page(Column):
    tag = "pa"

class ID(Column): # <ci> or <id>
    tag = "id"

class Category(Column): # <ct>
    tag = "ct"

class Date(Column):
    tag = "da"

class Author(Column): #<au>
    tag = "au"

class Title(Column):
    tag = "text.title"

class DataFormat(Column): # <il>
    tag = "il"

class Preamble(Column):
    def get(self, soup):
        return flatten(" ".join(node.get_text() for node in soup.find_all("text.preamble") or ()))

class Content(Column):
    def get(self, soup):
        return flatten(" ".join(node.get_text() for node in soup.find_all("text.cr") or ()))

class OCRQuality(Column):
    tag = "ocr"

class OCRQualityRelevant(Column):
    hidden = True
    def get(self, soup):
        pass


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
    Obtain an iterator of datafiles.
    """

    for date in pd.date_range(start, end):
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


def soup2data(file_obj, soup, *columns):
    """
    """

    writer = csv.writer(fobj, dialect="excel", fieldnames = (column.title for column in columns))
    
    for node in (node for node in soup if node):
        writer.writerow(*(tuple(column.get(node))))
    
    
    spamwriter.writerow(['Spam'] * 5 + ['Baked Beans'])
    spamwriter.writerow(['Spam', 'Lovely Spam', 'Wonderful Spam'])


    return pd.DataFrame(
        (
            tuple(
                column.get(node) for column in columns
            )
            for node in soup if node
        ),
        columns = [ column.title for column in columns ]
    )


def iterate_csv(start, end, regenerate = True):

    for date, xmlfile, csvfile in datafiles(start, end):
        if not os.path.isfile(xmlfile):
            continue

        existing = os.path.isfile(csvfile)
        if regenerate or not existing:
            print("CSV file needs to be (re)generated. Now regenerating...")

            try:
                # Obtain soup
                with open(xmlfile, "r") as f:
                    data = f.read()
                soup = BeautifulSoup(data, "lxml-xml")

                # Obtain data
                frame = soup2data(soup.find_all("article"), *Column.columns())

                # Save it
                if not os.path.isdir(os.path.dirname(csvfile)):
                    os.makedirs(os.path.dirname(csvfile))
                frame.to_csv(csvfile, encoding = "UTF8")
            except e:
                print("There was an error, but we're continuing anyway.")
                continue

        yield csvfile



def stream_csv(fn):
    with io.open(fn, "rb") as f:
        csv.reader(f, delimiter=' ', quotechar='|')
...     for row in spamreader:
...         print ', '.join(row)





"""
class cat(object):

    def __init__(self, fname):
        self.fname = fname

    def __enter__(self):
        print "[Opening file %s]" % (self.fname,)
        self.file_obj = open(self.fname, "rt")
        return self

    def __exit__(self, *exc_info):
        print "[Closing file %s]" % (self.fname,)
        self.file_obj.close()

    def __iter__(self):
        return self

    def next(self):
        line = self.file_obj.next().strip()
        print "[Read: %s]" % (line,)
        return line


def main():
    with cat("/etc/passwd") as lines:
        for line in lines:
            if "mail" in line:
                print line.strip()
                break
"""





from datetime import datetime
run(datetime.strptime("1950-01-01", "%Y-%m-%d"), datetime.strptime("1950-12-31", "%Y-%m-%d"))