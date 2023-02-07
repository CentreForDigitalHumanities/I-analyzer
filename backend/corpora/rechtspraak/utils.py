from bs4 import BeautifulSoup
import urllib.request
import os.path as op

HERE = op.abspath(op.dirname(__file__))

# Pairs of plural, singular names of valuelists
# Used to retrieve filter options
RESOURCES = [('Instanties', 'instantie'),
             ('Proceduresoorten', 'proceduresoort'),
             ('Rechtsgebieden', 'rechtsgebied')]


def get_valuelist(term):
    '''Gets a 'waardelijst' from data.rechtspraak.nl
        Used to determine keyword values
    '''
    with urllib.request.urlopen(f'https://data.rechtspraak.nl/Waardelijst/{term}') as f:
        data = f.read().decode('utf-8')
    return BeautifulSoup(data, 'lxml')


def count_options(term, tagname):
    soup = get_valuelist(term)
    return len(soup.find_all(tagname))


def find_counts():
    for (name, tagname) in RESOURCES:
        print(name, count_options(name, tagname))


if __name__ == '__main__':
    find_counts()
