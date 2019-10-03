import os
from os.path import exists, split, join, splitext
import subprocess

def convert_tif_to_pdf(data_dir):
    lib_call = ['export', 'DYLD_LIBRARY_PATH="$MAGICK_HOME/lib/"']
    subprocess.check_call(lib_call, shell=True)
    for directory, subdirs, filenames in os.walk(data_dir):
        _body, tail = split(directory)
        if data_dir.endswith(tail):
            # do not perform operations in root
            continue
        elif tail=='DTDs':
            subdirs[:] = []
            continue
        elif tail=='XML':
            subdirs[:] = []
        if not len(filenames) or filenames[0].startswith('.'):
            continue
        book_id = split(directory)[1]
        pdf_name = join(directory, '{}.pdf'.format(book_id))
        print(pdf_name)
        if exists(pdf_name):
            print("exists, skipping")
            continue
        elif splitext(filenames[0])[1]=='.tif':
            magick_call = ['magick', '-quiet', '*.tif', pdf_name]
        elif splitext(filenames[0])[1]=='.TIF':
            magick_call = ['magick', '-quiet', '*.TIF', pdf_name]
        else:
            print(splitext(filenames[0]))
            continue
        os.chdir(directory)
        subprocess.check_call(magick_call)