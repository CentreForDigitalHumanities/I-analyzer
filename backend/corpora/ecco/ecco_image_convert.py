import os
from os.path import split, join
import subprocess

def convert_tif_to_pdf(data_dir):
    lib_call = ['export', 'DYLD_LIBRARY_PATH="$MAGICK_HOME/lib/"']
    subprocess.check_call(lib_call, shell=True)
    for directory, subdirs, filenames in os.walk(data_dir):
        _body, tail = split(directory)
        if tail=='ECCO':
            continue
        elif tail=='XML':
            subdirs[:] = []
        if not len(filenames) or filenames[0].startswith('.'):
            continue
        book_id = split(directory)[1]
        pdf_name ='{}/{}.pdf'.format(directory, book_id)
        print(pdf_name)
        os.chdir(directory)
        magick_call = ['magick', '*.TIF', pdf_name]
        subprocess.check_call(magick_call)