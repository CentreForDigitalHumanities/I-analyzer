import os
import sys
import glob
import argparse
from bs4 import BeautifulSoup


def main(sys_args):
    args = parse_arguments(sys_args)
    prepare_out_folder(args.out_folder)
    preprocess(args.xml_folder, args.out_folder)

def prepare_out_folder(out_folder):
    if not os.path.exists(out_folder):
        os.makedirs(out_folder)
    else:
        files = glob.glob('{}/*'.format(out_folder))
        for f in files:
            os.remove(f)

def preprocess(in_folder, out_folder):

    for filepath in glob.iglob('{}/*.xml'.format(in_folder)):
        with open(filepath, 'r') as xml:
            soup = BeautifulSoup(xml.read(), 'xml')

        filename = os.path.basename(filepath)
        keep_only_transcription(filename, soup, out_folder)
        # TODO: add extraction of foreigns


def keep_only_transcription(filename, soup, out_folder):
        out_file = os.path.join(get_subfolder(out_folder, 'tei_with_transcription_only'), filename)

        text_tag = soup.find('text')
        transcription = get_transcription(filename, text_tag)
        text_tag.clear()
        if transcription:
            text_tag.append(transcription)

        with open(out_file, 'w') as f_out:
            f_out.write(str(soup))


## TODO: extract foreign and export them to separate file.
# def do_something_with_foreign(filename, soup):
#     text_tag = soup.find('text')
    #     transcription = get_transcription(filename, text_tag)
    #     if transcription:
    #         foreigns = text_tag.find_all('foreign')
    #         # print(foreigns)

    #         for f in foreigns:
    #             if f.findChild():
    #                 print(f)


def get_transcription(filename, text_tag):
    transcription = text_tag.find('div', { 'subtype': 'transcription'})

    # if there is no transcription, fallback to diplomatic
    if not transcription:
        transcription = text_tag.find('div', { 'subtype': 'diplomatic'})

    if not transcription:
        print('No transcription found in {}'.format(filename))
    return transcription


def get_subfolder(folder, subfoldername):
    '''
    Get a subfolder with `subfoldername` in `folder`.
    Will be created if it doesn't exist.
    '''
    path = os.path.join(folder, subfoldername)
    if not os.path.exists(path):
        os.makedirs(path)
    return path


def parse_arguments(sys_args):
    '''
    Parse the supplied arguments.
    '''
    parser = argparse.ArgumentParser(
        description='Preprocess EpiDoc scrapes, i.e. extract Leiden')

    parser.add_argument(
        '--xml_folder', '-xml', dest='xml_folder', required=True,
        help='Path to the folder where the .xml files reside.')

    parser.add_argument(
        '--out_folder', '-out', dest='out_folder', required=True,
        help='Path to the folder where the output should end up. Will be created if it doesn\'t exist or emptied out if it does.')

    parsedArgs = parser.parse_args()
    return parsedArgs

if __name__ == "__main__":
    main(sys.argv)
