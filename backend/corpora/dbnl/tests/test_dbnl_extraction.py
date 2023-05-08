import pytest
import os
from bs4 import BeautifulSoup

from addcorpus.load_corpus import load_corpus
from addcorpus.extract import XML
from corpora.dbnl.utils import extract_metadata, compose, append_to_tag

here = os.path.abspath(os.path.dirname(__file__))

def test_compose():
    assert compose(str.upper, ' '.join)(['a', 'b']) == 'A B'

def test_metadata_extraction():
    csv_path = os.path.join(here, 'data', 'titels_pd.csv')
    data = extract_metadata(csv_path)
    assert len(data) == 7

    item = data['maer005sing01']
    assert item['titel'] == 'Het singende nachtegaeltje'
    assert len(item['auteurs']) == 1

    multiple_authors = data['maer002spie00']
    assert multiple_authors['titel'] == 'Spiegel historiael (5 delen)'
    assert len(multiple_authors['auteurs']) == 3

append_testcases = [
    (
        '<row><cell>Vraeghje wie het meeste goedt.</cell><cell>107</cell></row>',
        'cell',
        ' ',
        'Vraeghje wie het meeste goedt.107',
        'Vraeghje wie het meeste goedt. 107',
    ),
    (
        '<l>Nu lokken schone Prenten<lb/>\nHun beider vrolijke ogen</l>',
        'lb',
        '\n',
        'Nu lokken schone Prenten Hun beider vrolijke ogen',
        'Nu lokken schone Prenten\nHun beider vrolijke ogen',
    ),
]

@pytest.mark.parametrize(['xml', 'tag', 'padding', 'original_output', 'new_output'], append_testcases)
def test_append_to_tag(xml, tag, padding, original_output, new_output):
    soup = BeautifulSoup(xml, 'lxml-xml')
    extractor = XML(flatten=True)
    assert extractor._flatten(soup) == original_output

    edited_soup = append_to_tag(soup, tag, padding)

    assert extractor._flatten(edited_soup) == new_output

@pytest.fixture
def dbnl_corpus(settings):
    settings.DBNL_DATA = os.path.join(here, 'data')
    settings.CORPORA = {
        'dbnl': os.path.join(here, '..', 'dbnl.py')
    }
    return 'dbnl'

expected_docs = [
    {
        'title_id': 'maer005sing01_01',
        'title': 'Het singende nachtegaeltje',
        'id': 'maer005sing01_01_0000',
        'volumes': None,
        'edition': '1ste druk',
        'author_id': 'maer005',
        'author': 'Cornelis Maertsz.',
        'author_year_of_birth': None,
        'author_place_of_birth': 'Wervershoof',
        'author_year_of_death': 'na 1671',
        'author_place_of_death': None,
        'author_gender': 'man/unknown',
        'url': 'https://dbnl.org/tekst/maer005sing01_01',
        'year': '1671',
        'year_full': '1671',
        'genre': 'poëzie',
        'language': 'Nederlands',
        'language_code': 'nl',
        'content': '\n'.join([
            'Het singende Nachtegaeltje',
            'Quelende soetelijck, tot stichtelijck vermaeck voor de Christelijck Ieught.',
            'Door.',
            'Cornelis Maertsz. tot Wervers hoof.',
            '\'t Amsterdam Voor Michiel de Groot, Boek-Verkooper op den Nieuwen Dijck, 1671.',
        ]),
        'chapter_title': None,
        'chapter_index': 1,
    },
    {
        'title_id': 'maer005sing01_01',
        'title': 'Het singende nachtegaeltje',
        'id': 'maer005sing01_01_0001',
        'volumes': None,
        'edition': '1ste druk',
        'author_id': 'maer005',
        'author': 'Cornelis Maertsz.',
        'author_year_of_birth': None,
        'author_place_of_birth': 'Wervershoof',
        'author_year_of_death': 'na 1671',
        'author_place_of_death': None,
        'author_gender': 'man',
        'url': 'https://dbnl.org/tekst/maer005sing01_01',
        'year': '1671',
        'year_full': '1671',
        'genre': 'poëzie',
        'language': 'Nederlands',
        'language_code': 'nl',
        'content': '\n'.join([
            'Op De vermakelijke en stightelijke Liedekens van Cornelis Maarts',
            'SOo wort de schrand\'re Rey der vloeiende Poëten',
            'Door u, o waerde Vriend! vervult,',
            'Soo wort uw\' Naam met Eer vergult,',
            'En door de Lof-bazuin roem rughtigh uitgekreten,',
            'De Dight-kunst scheen wel eer in Amstel silte Plassen',
            'Alleen te sitten op haer throon,',
            'Maar ghy stelt in uw\' Dight ten toon',
            'Dat in ons Wervershoof nogh eed\'ler vrughten wassen.',
            'Want\'t baat niet dat men kan een yd\'le Pen beswang\'ren',
            'Met wonderlijck Gedight,',
            'Indienmen niet en stight,',
            'Maer met een Heydensch rot vervult de Mond der Sang\'ren.',
            'Ghy soeckt de Af-breuk van het Rijck des Helschen lagers.',
            'Dies ghy een Heiligh Ooghwit raakt,',
            'En onse Ieught sticht en vermaakt',
            'Soo volght ghy \'t saligh Spoor des Ioodschen Harpe-Slagers.',
            'Treet voort dien Eerbaan in, en laat geen Aardsch gewemel',
            'V hind\'ren in soo eed\'len Saak,',
            'Soo streckt uw \'Lands-lien tot een Baak',
            'En voert ons dart\'le Ieughd al singende ten Hemel.',
            'H. Vander Meer.',
        ]),
        'chapter_title': 'Op De vermakelijke en stightelijke Liedekens van Cornelis Maarts',
        'chapter_index': 2,
    }
]



def test_dbnl_extraction(dbnl_corpus):
    corpus = load_corpus(dbnl_corpus)
    docs = list(corpus.documents())

    assert len(docs) == 70

    for actual, expected in zip(docs, expected_docs):
        assert actual == expected

