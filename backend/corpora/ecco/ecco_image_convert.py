import os
from os.path import split, join
import subprocess

def convert_tif_to_pdf(data_dir):
    #data_dir = '/Users/janss089/DATA/ECCO'
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
        pdf_name ='{}/out.pdf'.format(directory)
        os.chdir(directory)
        magick_call = ['magick', '*.TIF', pdf_name]
        subprocess.check_call(magick_call)