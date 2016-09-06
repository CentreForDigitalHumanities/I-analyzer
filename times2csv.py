#!/usr/bin/env python3
# coding=utf-8

import config, os, os.path, re, html, csv

from bs4      import BeautifulSoup
from datetime import datetime, timedelta
from flask    import Flask, Blueprint, Response, request, abort, current_app, \
    render_template, url_for, stream_with_context, jsonify



# Routes #######################################################################


times2csv = Blueprint("times2csv", __name__)


@times2csv.route('/', methods=["GET"])
def init():
    return render_template("app.html", columns = Column.columns())



@times2csv.route('/inspect', methods=["GET"])
def inspect():
    abort(404)

    for date, xmlfile, csvfile in datafiles(datetime(year=1950, month=1, day=1), datetime(year=1950, month=12, day=1)):
        if os.path.exists(xmlfile):

            with open(xmlfile, "rb") as f:
                data = f.read()
            soup = BeautifulSoup(data, "lxml-xml")

            result = dict()
            for node in soup.descendants:
                tag = node.name
                if tag is None:
                    continue
                if not tag in result and node.string:
                    result[tag] = [node.string]
                elif len(result.get(tag,[])) < 20 and node.string:
                    if not tag in result:
                        result[tag] = []
                    result[tag].append(node.string)

            return jsonify(result)



@times2csv.route('/stream', methods=["POST"])
def stream_csv():

    try:
        start = datetime.strptime(request.form.get("start"), "%Y-%m-%d")
        end   = datetime.strptime(request.form.get("end"),   "%Y-%m-%d")
        if start.year < 1950 or end.year > 1950 or start > end:
            raise ValueError()
    except (ValueError, TypeError):
        return "Invalid date"


    columns = filter(lambda x: ("col:" + x.title) in request.form, Column.columns())

    response = Response(stream_with_context(generate_csv(start, end, columns)), mimetype='text/csv')
    response.headers['Content-Disposition'] = \
        'attachment; filename=times-{start}-{end}.csv'.format(
            start = start.strftime("%Y%m%d"),
            end = end.strftime("%Y%m%d")
        )
    return response



# Auxiliaries ##################################################################


class Line(object):
    """
    Auxiliary. For streaming csv.
    """
    def __init__(self):
        self._line = None
    def write(self, line):
        self._line = line
    def read(self):
        return self._line



def generate_csv(start, end, columns, regenerate = True):
    """
    Generate specific columns from multiple CSV files, line-by-line.
    """

    columns = list(columns)

    line = Line()
    writer = csv.writer(line)
    writer.writerow(column.title for column in columns)
    yield line.read()

    for date, xmlfile, csvfile in datafiles(start, end):
        if regenerate or not os.path.isfile(csvfile):
            xml2csv(xmlfile, csvfile)

        with open(csvfile, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                writer.writerow(row.get(column.title) for column in columns)
                yield line.read()



def datafiles(start, end):
    """
    Obtain an iterator of filenames for the datafiles relevant to the given time
    period.
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
        if os.path.isfile(infile):
            yield (date, infile, outfile)
        date += delta



def xml2csv(xmlfile, csvfile):
    """
    Generate full CSV datafile from XML source.
    """

    current_app.logger.info('Generating '+csvfile)

    # Let's write all available columns
    columns = list(Column.columns())

    # Obtain soup
    with open(xmlfile, "rb") as f:
        data = f.read()
    soup = BeautifulSoup(data, "lxml-xml")

    issue = soup.issue
    articles = issue.find_all("article", recursive = False) if issue else []

    current_app.logger.info(str(len(articles)))

    # Create file
    if not os.path.isdir(os.path.dirname(csvfile)):
        os.makedirs(os.path.dirname(csvfile))

    with open(csvfile, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(col.title for col in columns)
        for article in articles:
            writer.writerow(col.fromsoup(issue, article) for col in columns)



# Columns ######################################################################

regex1 = re.compile('(?<=\S)\n(?=\S)| +')
regex2 = re.compile('\n+')

def flatten(text):
    """
    Obtain flat text content from a soup node.
    """

    global regex1
    global regex2
    return html.unescape(regex2.sub('\n', regex1.sub(' ', text)).strip())

class Column(object):

    def __init__(self, tag = None, title = None, recursive = False, is_global = False):
        self.title = title or self.__class__.__name__
        self.tag = tag
        self.recursive = recursive
        self.is_global = is_global



    @classmethod
    def columns(Column):
        return [
            Column(tag = "jn", title = "journal", is_global = True),
            Column(tag = "is", title = "issue", is_global = True),
            Column(tag = "da", title = "date", is_global = True),
            Column(tag = "ip", title = "IP", is_global = True),
            Column(tag = "pa", title = "page"),
            Column(tag = "id", title = "id"),
            Column(tag = "ct", title = "category"),
            Column(tag = "ocr", title = "ocr-quality"),
            Column(tag = "au", title = "author"),
            Column(tag = "ti", title = "heading"),
            Column(tag = "ta", title = "title"),
            Column(tag = "pc", title = "PC"),
            Column(tag = "sc", title = "SC"),
            AttachmentColumn(title = "attachment"),
            PreambleColumn(title = "preamble"),
            ContentColumn(title = "content"),
        ]


    def fromsoup(self, issue, article):
        """
        Default implementation
        """
        if not self.tag:
            raise NotImplementedError()

        source = issue if self.is_global else article
        node = source.find(self.tag, recursive = self.recursive)
        if node:
            return node.string


class AttachmentColumn(Column):
    def fromsoup(self, issue, article):
        nodes = article.find_all("il") or ()
        return " + ".join(node.string for node in nodes)

class PreambleColumn(Column):
    def fromsoup(self, issue, article):
        node = article.find("text.preamble")
        if node:
            return flatten(node.get_text())

class ContentColumn(Column):
    def fromsoup(self, issue, article):
        node = article.find("text.cr")
        if node:
            return flatten(node.get_text())



################################################################################

def create_app(cfg):
    """
    Set up app
    """

    app = Flask(__name__)
    app.config.from_object(cfg)
    app.register_blueprint(times2csv)

    return app


if __name__ == "__main__":
    app = create_app(config.Default())
    app.run()
