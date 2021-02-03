'''
This script is based on the convertDatabase.py Jelmer van Nuss wrote to extract
FIJI data from Ortal-Paz Saar's excelsheet. As opposed to that script (which seemed to have
worked only with a manually edited source file), it is explicit in the changes required
to extract the data. This hopefully secures that the script can be re-used when Ortal-Paz
sends us a updated excelsheet (e.g. with translations added).
'''
import os
import sys
import openpyxl
import argparse
from jinja2 import Template


def main(sys_args):
    args = parse_arguments(sys_args)
    out_folder = args.out_folder

    if not os.path.exists(out_folder):
        os.makedirs(out_folder)

    wb = openpyxl.load_workbook(args.input)
    sheet = wb['Sheet1']
    headers = list(list(sheet.values)[0])
    preprocess_headers(headers)
    for row in sheet.values:
        row_dict = {headers[i]: row[i] for i in range(len(row))}
        record = extract_record(row_dict)
        if record:
            export(out_folder, record)


def preprocess_headers(headers):
    for index, header in enumerate(headers):
        if header == 'Date (add 68 to the year of Temple destruction)':
            headers[index] = 'Date'
        if header == 'Sex ':
            headers[index] = 'Sex'
        if header == 'Iconography':
            headers[index] = 'Iconography type'
        if header == 'Iconography details':
            headers[index] = 'Iconography description'


def extract_record(row):
    if not row['Inscription no.']:
        return None
    return dict(
        title=row["Inscription no."],
        date=row["Date"],
        remarksOnDate=preprocess_text(row["Remarks on date"]),
        provenance=row["Provenance"],
        presentLocation=row["Present location"],
        publications=get_publications(row),
        facsimile=row["Photo / Facsimile from publication"],
        photosLeonard=row["Photos by Leonard"],
        image3D=row["3D image"],
        transcription=get_transcription(row),
        inscriptionType=row["Inscription type"],
        persons=get_persons(row),
        age=row['Age'],
        ageComments=preprocess_text(row["Remarks on age"]),
        iconographyType=row["Iconography type"],
        iconographyDescription=preprocess_text(row["Iconography description"]),
        material=row["Material"],
        languages=get_languages(row),
        incipit=row["Incipit"],
        commentary=get_commentary(row)
    )


def export(out_folder, record):
    export_path = os.path.join(out_folder, '{}.xml'.format(record['title']))
    with open('XMLtemplate.j2') as file_:
        template = Template(file_.read())

        with open(export_path, 'w+', encoding='utf-8') as xmlFile:
            xmlFile.write(template.render(record))


def get_publications(row):
    results = []
    publication_nos = str(row["No. in publication"]).split(';')
    publications = row["Publication"]
    if not publications:
        return results
    publications = publications.split(';')

    for index, pub in enumerate(publications):
        publication = pub.replace('\n', '')
        try:
            publication_no = publication_nos[index].replace('\n', '').strip()
            publication = "{} ({})".format(publication, publication_no)
        except IndexError:
            pass # ignore adding pub_no if it doesn't exist
        results.append(publication)
    return results


def get_transcription(row):
    transcription = preprocess_text(row["Transcription"])
    return transcription.replace('\n', '\n<lb/>\n')


def get_languages(row):
    value = row["Language"]
    if not value:
        return ""
    langs = value.split(',')
    if len(langs) > 1:
        cleaned = []
        for lang in langs:
            cleaned.append(lang.strip())
        return cleaned
    else:
        return langs


def get_commentary(row):
    commentary = row["Open questions / Remarks"]
    # add number of lines surviving (if it exists)
    # Note that at the time of writing, there is only 1 (!) record
    # that has data in this field
    additional = row['Number of lines (s=surviving, o=original)']
    if additional:
        period = commentary.endswith('.')
        commentary = '{}{} There are {} surviving lines.'.format(
            commentary, '.' if not period else '', additional
        )
    if commentary:
        return commentary
    else:
        return ""


def preprocess_text(text):
    '''
    Preprocess a text field.
    For now replaces < and > with html entities.
    '''
    if not text:
        return ""
    return text.replace('<', '&lt;').replace('>', '&gt;')


def get_persons(row):
    persons = []
    inscription_id = row['Inscription no.']
    names = get_names_from_field(row, "Names mentioned")
    namesHebrew = get_names_from_field(row, "Names mentioned (original language)")
    sexes = get_sexes(row)

    if len(names) == 1 and len(namesHebrew) > 1 and len(sexes) == 1:
        # if we have multiple Hebrew names, simply join them together
        # TODO: check with Ortal-Paz if this is ok
        persons.append(create_person(
            names[0], " ".join(namesHebrew), sexes[0]))
    elif len(names) == 1 and len(namesHebrew) == 1 and len(sexes) > 1 or inscription_id == '368':
        # if we have multiple sexes, store name(s) once and create a person entry to record each sex
        # also handles one special case (ID 368)
        for index, sex in enumerate(sexes):
            if index == 0:
                persons.append(create_person(
                    names[0], namesHebrew[0], sexes[0]))
            else:
                persons.append(create_person('', '', sexes[index]))
    elif len(names) > 1 or len(namesHebrew) > 1 or len(sexes) > 1:
        # TODO: discuss the three remaining cases with Ortal-Paz
        # custom cases for some rows
        # if row['Inscription no.'] == 33:
        #     persons.append(create_person(" ".join(names),
        #                                  " ".join(namesHebrew), sexes[0]))
        # else:
        #     pass
        # print(row['Inscription no.'])
        # print(names, namesHebrew, sexes)
        pass
    elif len(names) > 1 and len(namesHebrew) > 1 and len(sexes) > 1:
        # if we get here there are multiple people and we assume they are complete
        for index, name in enumerate(names):
            persons.append(create_person(
                name, namesHebrew[index], sexes[index]))
    else:
        # simple case of a single person
        name = first_or_empty(names)
        nameHebrew = first_or_empty(namesHebrew)
        sex = sexes[0]
        persons.append(create_person(name, nameHebrew, sex))

    return persons


def first_or_empty(_list):
    if len(_list) > 0:
        return _list[0]
    else:
        return ''


def get_names_from_field(row, field):
    results = []
    names_raw = extract_multifield(row, field, '\n')
    for name in names_raw:
        if name == 'X' or name == 'Χ':
            # Note that the second character is not a 'X', but one copy-pasted from the commandline (and which looks a lot like one)
            results.append('')
        else:
            results.append(name)
    return results


def get_sexes(row):
    results = []
    sexes_raw = extract_multifield(row, "Sex",  '\n')
    for sex in sexes_raw:
        if '?' in sex:
            results.append('Unknown')
        elif 'M' in sex and 'F' in sex:
            results.append('M')
            results.append('F')
        else:
            results.append(sex)
    return results


def create_person(name, nameHebrew, sex):
    if not name:
        return {
            'name': '', 'sex': sex
        }
    else:
        return {
            'name': "{} ({})".format(name, preprocess_text(nameHebrew)), 'sex': sex
        }


def extract_multifield(row, fieldname, splitter):
    '''
    Extract the values from a single field that (might) contains multiple values.
    Returns an array that will not contain empty strings or None.
    '''
    results = []
    content = row[fieldname]
    if not content:
        return results
    values = content.split(splitter)
    for value in values:
        if value:
            results.append(value)
    return results


def parse_arguments(sys_args):
    '''
    Parse the supplied arguments.
    '''
    parser = argparse.ArgumentParser(
        description='Preprocess FIJI csv (from excelsheet)')

    parser.add_argument(
        '--input', '-in', dest='input', required=False, default='FIJI_full.csv',
        help='Path to the CSV file that contains the data. Defaults to \'FIJI_full.csv\' (i.e. in the script\'s folder')

    parser.add_argument(
        '--delimiter', '-d', dest='delimiter', required=False, default=';',
        help='Character that delimits fields in the CSV. Defaults to \';\'')

    parser.add_argument(
        '--out_folder', '-out', dest='out_folder', required=False, default="FIJI",
        help='''Path to the folder where the output should end up.
            Will be created if it doesn\'t exist. Defaults to \'FIJI\' (i.e. in the script\'s folder)''')

    parsedArgs = parser.parse_args()
    return parsedArgs

if __name__ == "__main__":
    main(sys.argv)
