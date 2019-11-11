from PyPDF2 import PdfFileReader, PdfFileWriter
from io import BytesIO

from os.path import getsize, split

def pdf_pages(all_pages, pages_returned, home_page):
    '''
    Decide which pages should be returned, and the index of the home page in the resulting list
    '''
    context_radius = int((pages_returned - 1) / 2) #the number of pages before and after the initial
    #the page is within context_radius of the beginning of the pdf:
    if (home_page - context_radius) <= 0:
        pages = all_pages[:home_page+context_radius+1]
        home_page_index = pages.index(home_page)

    #the page is within context_radius of the end of the pdf:
    elif (home_page + context_radius) >= len(all_pages):
        pages = all_pages[home_page-context_radius:]
        home_page_index = pages.index(home_page)

    #normal case:
    else:
        pages = all_pages[(home_page-context_radius):(home_page+context_radius+1)]
        home_page_index = context_radius
    
    return pages, home_page_index

def build_partial_pdf(pages, input_pdf):
    '''
    Build a partial pdf consisting of the requires pages.
    Returns a temporary file stream.
    '''
    tmp = BytesIO()
    pdf_writer = PdfFileWriter()
    for p in pages:
        pdf_writer.addPage(input_pdf.getPage(p))
    pdf_writer.write(tmp)
    tmp.seek(0) #reset stream

    return tmp

def retrieve_pdf(path):
    '''
    Retrieve the pdf as a file object.
    '''
    pdf = PdfFileReader(path, 'rb')
    
    return pdf

def get_pdf_info(path):
    '''
    Gather pdf information.
    '''
    pdf = PdfFileReader(path, 'rb')
    title = pdf.getDocumentInfo().title
    _dir, filename = split(path)
    num_pages = pdf.getNumPages()
    info = {
        'filename': title if title else filename,
        'filesize': sizeof_fmt(getsize(path)),
        'all_pages': list(range(0, num_pages))
    }
    return info

def sizeof_fmt(num, suffix='B'):
    '''
    Converts numerical filesize to human-readable string.
    Maximum of three numbers before the decimal, and one behind.
    E.g. 124857000 -> "119.1 MB"
    '''
    for unit in ['','K','M','G']:
        if abs(num) < 1024.0:
            return "{:3.1f} {}{}".format(num, unit, suffix)
        num /= 1024.0
