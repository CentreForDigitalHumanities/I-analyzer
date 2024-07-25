'''Updates the CITATION.cff file:
    - Sets the date-released to the current date
    - Sets the version from toplevel package.json
'''

from datetime import datetime
import json
import re

CITATION_FILE = 'CITATION.CFF'
PACKAGE_FILE = 'package.json'
VERSION_PATTERN = r'^version:\s+.*$'
DATE_RELEASED_PATTERN = r'^date-released:.*$'
VERSION = None
TODAY = datetime.today().strftime('%Y-%m-%d')

with open(PACKAGE_FILE, 'r') as package_file:
    package_json = json.load(package_file)
    VERSION = package_json.get('version')


with open(CITATION_FILE) as citation_file:
    citation_in = citation_file.readlines()
    citation_out = []

    for line in citation_in:
        if re.match(VERSION_PATTERN, line):
            citation_out.append(f'version: {VERSION}\n')
        elif re.match(DATE_RELEASED_PATTERN, line):
            citation_out.append(f"date-released: '{TODAY}'\n")
        else:
            citation_out.append(line)

with open(CITATION_FILE, 'w') as citation_file:
    citation_file.writelines(citation_out)
