import os

from PIL import Image


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
            return {'succes': True}
    return {'succes': False}
