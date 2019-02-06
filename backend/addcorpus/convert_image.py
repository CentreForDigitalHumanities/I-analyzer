import os
import pwd
import grp
import logging

from PIL import Image
from progress.bar import Bar

BASE_DIR = '/its/times/TDA_GDA/TDA_GDA_1785-2009'
LOG_LOCATION = '/home/jvboheemen/convert_scripts'

# UID = pwd.getpwnam("root").gr_uid
# GID = grp.getgrnam("digitalhumanities").gr_gid


class ProgressBar(Bar):
    message = 'Converting'
    suffix = '%(percent).1f%% - %(eta)ds'


def convert_image(filepath, output_format='png', quality=50):
    path, _extension = os.path.splitext(filepath)
    out_file = '{}.{}'.format(path, output_format)
    if not os.path.isfile(out_file):
        try:
            with Image.open(filepath) as image:
                image.save(fp=out_file, format=output_format.upper(),
                           quality=quality)
                # os.chown(out_file, uid, gid)
        except Exception as e:
            # logging.warning('file {} failed to convert'.format(out_file))
            logging.error(e)


def files_per_year(year, base_dir=BASE_DIR, input_format='.tif'):
    for dir_, _, files in os.walk(os.path.join(base_dir, str(year))):
        for file in files:
            _name, extension = os.path.splitext(file)
            if extension == input_format:
                yield os.path.join(dir_, file)


def count_per_year(year, base_dir=BASE_DIR, input_format='.tif'):
    nr_of_files = 0
    for _, _, files in os.walk(os.path.join(base_dir, str(year))):
        nr_of_files += len([f for f in files if f.endswith(input_format)])
    return(nr_of_files)


def convert_year(year, base_dir=BASE_DIR, input_format='.tif'):
    nr_files = count_per_year(year)
    logging.info(
        'Converting year {}, {} {}-files'.format(year, nr_files, input_format))
    print('Year {}, {} files'.format(year, nr_files))
    bar = ProgressBar(max=nr_files)
    for file in files_per_year(year):
        convert_image(file)
        bar.next()
    bar.finish()
    logging.info('Converting year {}: done.'.format(year))


def convert_year_range(start_year, end_year):
    logging.info('Converting years {} to {}'.format(start_year, end_year))
    for year in range(start_year, end_year+1):
        convert_year(year)
    logging.info('Converting done. Years {} to {}'.format(
        start_year, end_year))


if __name__ == '__main__':
    logging.basicConfig(filename=os.path.join(LOG_LOCATION, 'convert.log'),
                        format='%(asctime)s\t%(levelname)s:\t%(message)s', datefmt='%c', level=logging.INFO)
    logging.info('Start converting...')

    convert_year_range(1785, 1786)
