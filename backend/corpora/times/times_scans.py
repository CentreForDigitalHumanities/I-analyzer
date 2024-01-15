#!/usr/bin/env python3

import logging
import os
import re
from datetime import datetime

logger = logging.getLogger(__name__)

ID_TO_FILENAME_PATTERN = r'(.+)\-\d{3}'
DIR_PRE_2010 = 'TDA_GDA_1785-2009'
DIR_2010 = 'TDA_2010'


def compose_rel_image_path(date, id):
    '''Retrieve last components of image path:
        - year directory
        - formatted datestring (e.g. 19871201)
        - image name
        - image extension (.png)
    '''
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        datestring = date_obj.strftime('%Y%m%d')
        year = date_obj.year
        file_name = get_imagename(id)
        return (year, datestring, file_name)

    except Exception as e:
        logger.error(
            f'failed to compose image path for {datestring} {id}:\t{e}')


def compose_absolute_image_path(corpus_dir, date, id):
    '''Compose the fullm absolute path to the image, comprised of:
        - data directory
        - fixed prefix TDA_GDA
        - either TDA_GDA_1785-2009 or TDA_2010 based on year
        - relative path, see compose_rel_image_path
    '''

    year, formatted_date, fn = compose_rel_image_path(date, id)
    subset_prefix = DIR_2010 if year == 2010 else DIR_PRE_2010
    return os.path.join(corpus_dir, 'TDA_GDA', subset_prefix, str(year), formatted_date, fn)


def get_imagename(id):
    '''The image name is the document ID minus the final three numbers
    eg: ID = 0FFO-1987-1201-0001-001, name = 0FFO-1987-1201-0001.png
    '''
    try:
        fn_match = re.search(ID_TO_FILENAME_PATTERN, id)
        file_name = fn_match.group(1) + '.png'
        return file_name
    except Exception:
        return None
