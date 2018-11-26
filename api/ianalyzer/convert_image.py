from PIL import Image
import os
import sys
from time import sleep


def batch_convert(top_dir, output_dir):
    total_tifs = 0
    for _, _, files in os.walk(top_dir):
        tif_files = [f for f in files if f.endswith('.tif')]
        total_tifs += len(tif_files)

    print(str(total_tifs)+'\n')

    counter = 1
    for dir_, _, filenames in os.walk(top_dir):
        for filename in filenames:
            name, extension = os.path.splitext(filename)
            if extension in ['.tiff', '.tif']:
                relative_dir = os.path.relpath(dir_, top_dir)
                output_sub_dir = os.path.join(output_dir, relative_dir)
                if not os.path.exists(output_sub_dir):
                    os.makedirs(output_sub_dir)
                output_filename = os.path.join(output_sub_dir, name)
                if not os.path.isfile(output_filename+'.png'):
                    try:
                        img_tif = Image.open(os.path.join(dir_, filename))
                        img_tif.save(output_filename+'.png',
                                     'PNG', quality=70)
                        print("\r{}\\{}".format(counter, total_tifs))
                        counter += 1
                    except:
                        print('error in: \t{}'.format(output_filename))
                        counter += 1


# batch_convert('/Users/3248526/corpora/times', '/Users/3248526/corpora/times')

def convert_image(source_image_path, output_format='png'):
    if os.path.isfile(source_image_path):
        file_path, _extension = os.path.splitext(source_image_path)
        out_file_path = file_path + '.' + output_format

        if not os.path.isfile(out_file_path):
            source_image = Image.open(source_image_path)
            source_image.save(
                fp=file_path+'.'+output_format,
                format=output_format.upper()
            )
            return 'succes'
    return 'failure'


convert_image(
    '/Users/3248526/corpora/times/TDA_GDA/TDA_GDA_1785-2009/1987/19871201/0FFO-1987-1201-0001.tif')
