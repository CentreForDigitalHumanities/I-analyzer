#!/usr/bin/env python3

import sys
from progress.bar import Bar
from datetime import datetime
import os
from elasticsearch import Elasticsearch
import logging
logger = logging.getLogger(__name__)


updated_docs = 0
bar = None

BASE_DIR = '/its/times/TDA_GDA/TDA_GDA_1785-2009'
LOG_LOCATION = '/home/jvboheemen/convert_scripts'
node = {'host': 'im-linux-elasticsearch01.im.hum.uu.nl', 'port': '9200'}

START_YEAR = 1983
END_YEAR = 1990


class ProgressBar(Bar):
    suffix = '%(percent).1f%% - %(eta)ds'


def parse_page_number(input):
    if input.isdigit():
        return int(input)

    elif roman_to_int(input):
        return roman_to_int(input)

    elif written_to_int(input):
        return written_to_int(input)

    # '[1]'
    # elif re.match(r'^\[(\d+)\]$', input):
    #     return int(re.match(r'^\[(\d+)\]$', input).group(1))

    else:
        return None


def written_to_int(input):
    lookup = {
        'one': 1,
        'two': 2,
        'three': 3,
        'four': 4,
        'five': 5,
        'six': 6,
        'seven': 7,
        'eight': 8,
        'nine': 9,
        'ten': 10
    }

    if not input.lower() in lookup.keys():
        return None
    return lookup[input.lower()]


def int_to_roman(input):
    """ Convert an integer to a Roman numeral. """

    if not isinstance(input, type(1)):
        # raise TypeError, "expected integer, got %s" % type(input)
        return None
    if not 0 < input < 4000:
        # raise ValueError, "Argument must be between 1 and 3999"
        return None
    ints = (1000, 900,  500, 400, 100,  90, 50,  40, 10,  9,   5,  4,   1)
    nums = ('M',  'CM', 'D', 'CD', 'C', 'XC',
            'L', 'XL', 'X', 'IX', 'V', 'IV', 'I')
    result = []
    for i in range(len(ints)):
        count = int(input / ints[i])
        result.append(nums[i] * count)
        input -= ints[i] * count
    return ''.join(result)


def roman_to_int(input_num):
    """Convert a Roman numeral to an integer.
    Via https://www.oreilly.com/library/view/python-cookbook/0596001673/ch03s24.html"""
    if not isinstance(input_num, type("")):
        return input_num
        # raise TypeError, "expected string, got %s" % type(input_num)
    input_num = input_num.upper()
    nums = {'M': 1000, 'D': 500, 'C': 100,
            'L': 50, 'X': 10, 'V': 5, 'I': 1}
    sum = 0
    for i in range(len(input_num)):
        try:
            value = nums[input_num[i]]
            if i+1 < len(input_num) and nums[input_num[i+1]] > value:
                sum -= value
            else:
                sum += value
        except KeyError:
            return None
            # raise ValueError, 'input_num is not a valid Roman numeral: %s' % input_num
    if int_to_roman(sum) == input_num:
        return sum
    else:
        return None


def update_one_year(year, index, page_size, doc_type, corpus_dir, scroll):
    es = Elasticsearch([node])
    nr_of_docs = es.count(
        index=['times'],
        body={
            "query": {
                "bool": {
                    "must": {
                        "range": {
                            "date": {
                                "gte": "{}-01-01".format(year),
                                "lte": "{}-12-31".format(year)
                            }
                        }
                    }
                },
            }
        }
    )['count']

    # progress bar
    global bar
    bar = Bar(max=nr_of_docs, message=str(year),
              suffix='%(percent).1f%% - %(eta)ds')

    # Collect initial page
    page = init_search(es, index, doc_type, page_size,
                       scroll, year)
    total_hits = page['hits']['total']
    scroll_size = len(page['hits']['hits'])

    logging.warning("Starting collection of images for {} documents in index '{}', year {}".format(
        total_hits, index, year))

    while scroll_size > 0:
        # Get the current scroll ID
        sid = page['_scroll_id']
        # Process current batch of hits
        process_hits(page['hits']['hits'], es, index, doc_type, corpus_dir)
        # Scroll to next page
        page = es.scroll(scroll_id=sid, scroll=scroll)
        # Get the number of results in current page to control loop
        scroll_size = len(page['hits']['hits'])

    bar.finish()
    global updated_docs
    logging.warning(
        "Updated {}/{} documents for year {}.".format(updated_docs, total_hits, year))
    updated_docs = 0


def add_images(page_size, start_year, end_year):
    index = 'times'
    doc_type = 'article'
    corpus_dir = BASE_DIR
    scroll = '3m'

    if end_year == start_year:
        update_one_year(start_year, index, page_size,
                        doc_type, corpus_dir, scroll)
    else:
        for year in range(start_year, end_year):
            update_one_year(year, index, page_size,
                            doc_type, corpus_dir, scroll)


def init_search(es, index, doc_type, page_size, scroll_timeout, year):
    return es.search(
        index=[index],
        body={
            "_source": ["date", "page"],
            "query": {
                "bool": {
                    "must": {
                        "range": {
                            "date": {
                                "gte": "{}-01-01".format(year),
                                "lte": "{}-12-31".format(year)
                            }
                        }
                    }
                },
            }
        },
        doc_type=doc_type,
        params={"scroll": scroll_timeout, "size": page_size}
    )


def process_hits(hits, es, index, doc_type, corpus_dir):
    for doc in hits:
        date, page = doc['_source']['date'], doc['_source']['page']
        es_doc_id = doc['_id']
        try:
            image_path = compose_image_path(date, page, corpus_dir)
            if image_path:
                update_document(es, index, doc_type, es_doc_id, image_path)
        except Exception as e:
            page = page if page is not None else 'Unknown'
            date = date if date is not None else 'Unknown'
            logging.warning('Error updating doc {}. Date: {}, page: {}'.format(
                doc['_id'], date, page))
            # logging.warning(e)
        global bar
        bar.next()


def compose_image_path(date_string, page, corpus_dir):
    '''
    Up to and including 1985: 0FFO-1985-JAN02-001
    After 1985: 0FFO-1985-0102-001
    '''
    date_obj = datetime.strptime(date_string, '%Y-%m-%d')
    year, month, day = str(date_obj.year), '{0:02d}'.format(
        date_obj.month), "{0:02d}".format(date_obj.day)

    page = parse_page_number(page)
    if not page:
        return None

    if int(year) > 1985:
        page_str = '{0:04d}'.format(int(page))
        file_name = '0FFO-{}-{}{}-{}'.format(year, month, day, page_str)+'.png'
    else:
        page_str = '{0:03d}'.format(int(page))
        file_name = '0FFO-{}-{}{}-{}'.format(year,
                                             date_obj.strftime('%b').upper(), day, page_str)+'.png'

    relative_path = os.path.join(year, year+month+day, file_name)
    complete_path = os.path.join(corpus_dir, relative_path)
    if os.path.isfile(complete_path):
        return os.path.join('TDA_GDA', 'TDA_GDA_1785-2009', relative_path)
    else:
        logging.warning('Image {} does not exist'.format(complete_path))
        return None


def update_document(es, index, doc_type, doc_id, image_path):
    body = {"doc": {"image_path": image_path}}
    es.update(index=index, doc_type=doc_type, id=doc_id, body=body)
    global updated_docs
    updated_docs += 1


if __name__ == "__main__":
    logfile = 'indexupdate.log'
    logging.basicConfig(filename=os.path.join(LOG_LOCATION, 'redo_from_1982.log'),
                        format='%(asctime)s\t%(levelname)s:\t%(message)s', datefmt='%c', level=logging.WARNING)
    add_images(100, START_YEAR, END_YEAR)
