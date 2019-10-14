import os
from os.path import exists, split, join, splitext
import subprocess
import glob

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
        os.chdir(directory)
        for filename in filenames:
            name, ext = splitext(filename)
            if ext=='.tif' or ext=='.TIF': 
                magick_call = ['convert', filename, '-quiet', name+'.pdf']
                subprocess.check_call(magick_call)
        with open("files.txt", "w") as f:
            f.write(' '.join(sorted(glob.glob("*.pdf"))))
        # combine all pdfs in one file
        ghostscript_call = ['gs', '-sDEVICE=pdfwrite', '-dBATCH', '-dNOPAUSE',
                '-sOutputFile='+pdf_name, '@files.txt']
        subprocess.check_call(ghostscript_call)
        # remove temporary files
        remove_call = ['find', '.', '-type', 'f', '-name', book_id+'0*.pdf', '-delete']
        subprocess.check_call(remove_call)
        remove_call = ['rm', 'files.txt']
        subprocess.check_call(remove_call)
        
        