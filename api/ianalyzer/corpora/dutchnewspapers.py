'''
Collect corpus-specific information, that is, data structures and file
locations.
'''

import logging
logger = logging.getLogger(__name__)
import os
from os.path import join, isfile, splitext
from datetime import datetime, timedelta
import re
import random
from pprint import pprint

from ianalyzer import config_fallback as config
from ianalyzer import extract
from ianalyzer import filters
from ianalyzer.corpora.common import XMLCorpus, Field, until, after, string_contains

# Source files ################################################################


class DutchNewspapers(XMLCorpus):
    title = config.DUTCHNEWSPAPERS_TITLE
    description = config.DUTCHNEWSPAPERS_DESCRIPTION
    data_directory = config.DUTCHNEWSPAPERS_DATA
    min_date = config.DUTCHNEWSPAPERS_MIN_DATE
    max_date = config.DUTCHNEWSPAPERS_MAX_DATE
    es_index = config.DUTCHNEWSPAPERS_ES_INDEX
    es_doctype = config.DUTCHNEWSPAPERS_ES_DOCTYPE
    es_settings = None
    image = config.DUTCHNEWSPAPERS_IMAGE

    xml_tag_toplevel = 'text'
    xml_tag_entry = 'p'

    # New data members
    definition_pattern = re.compile(r'didl')
    page_pattern = re.compile(r'.*_(\d+)_alto')
    article_pattern = re.compile(r'.*_(\d+)_articletext')

    filename_pattern = re.compile(r'[a-zA-z]+_(\d+)_(\d+)')

    non_xml_msg = 'Skipping non-XML file {}'
    non_match_msg = 'Skipping XML file with nonmatching name {}'

    def sources(self, start=min_date, end=max_date):
        logger = logging.getLogger(__name__)
        for directory, _, filenames in os.walk(self.data_directory):
            d = []
            for filename in filenames:
                if filename != '.DS_Store':
                    name, extension = splitext(filename)
                    full_path = join(directory, filename)
                    if extension != '.xml':
                        logger.debug(self.non_xml_msg.format(full_path))
                        continue
                    def_match = self.definition_pattern.match(name)
                    article_match = self.article_pattern.match(name)
                    if def_match:
                        d.append((full_path, {'file_tag': 'definition'}))
                    if article_match:
                        id = os.path.basename(os.path.dirname(
                            full_path)) + article_match.group(1)
                        d.append((full_path, {'id': id}))
            if d != []:
                yield d

    papers = ['Advertentieblad, bekendmakingen en onderscheidene berigten van Groningen', 'Advertentieblad van het departement van de Wester-Eems', "Affiches, annonces et avis divers d'Amsterdam = Advertentiën, aankondigingen en verschillende berigten van Amsterdam", 'Affiches, annonces et avis divers de Leyde = Advertentiën, aankondigingen en berigten van Leyden', 'Affiches, annonces et avis divers de Rotterdam = Advertentien, aankondigingen en berigten van Rotterdam', 'Algemeen Handelsblad', 'Algemeen Nederlandsch nieuws- en advertentie-blad', 'Amsterdamsche courant', 'Amsterdamse courant', 'Apeldoornsche courant', 'Arnhemsche courant', 'Avec privilège de nos-seigneurs les Etats de Hollande et de West-Frise', 'Bataafsche Leeuwarder courant', 'Bataafsche staats-courant', 'Bataviaasch advertentie-blad', 'Bataviaasch handelsblad', 'Bataviasche courant', 'Bataviasche koloniale courant', 'Bataviase nouvelles', 'Binnenlandsche Bataafsche courant', 'Bossche vaderlandsche courant', 'Bredasche courant', 'Constitutioneele oprechte Bataafsche courant / door M. Bos', 'Courante uyt Italien, Duytslandt, &c.', "Courrier d'Amsterdam = Courier van Amsterdam", 'Dagblad der provincie Braband', 'Dagblad van het departement der monden van den Rhyn', "Dagblad van 's Gravenhage", "Dagblad van Zuidholland en 's Gravenhage", 'De avondbode : algemeen nieuwsblad voor staatkunde, handel, nijverheid, landbouw, kunsten, wetenschappen, enz. / doorCh.G. Withuys', "De constitutioneel : nieuwe 's-Gravenhaagsche courant", 'De Curaçaosche courant', 'De Curaçaosche courant', 'De Gooi- en Eemlander : nieuws- en advertentieblad', 'De grondwet', 'De kolonist : dagblad toegewyd aan de belangen van Suriname', 'Delfsche courant', 'Delftsche courant : nieuwsblad voor Delft en Delfland', 'De locomotief : Samarangsch handels- en advertentie-blad', 'De maasbode', 'De Nederlander : nieuwe Utrechtsche courant : (staatkundig- nieuws-, handels- en advertentie-blad) / onder red. van J. van Hall', 'De nieuwe Haagse Nederlandse courant', 'De nieuwe Nederlandsche courant', 'De Noord-Brabanter : staat- en letterkundig dagblad', 'De Oostpost : letterkundig, wetenschappelĳken commercieel nieuws- en advertentieblad', 'De Sheboygan Nieuwsbode', 'De standaard', 'De Surinaamsche nieuwsvertelder', 'De Tĳd : godsdienstig-staatkundig dagblad', 'De Tijd : godsdienstig-staatkundig dagblad', 'De Volksvriend', 'De voorheen Stichtsche nu Rhynlandsche courant', 'De weeklyksche ... Surinaamse Courant', 'De West-Indiër : dagblad toegewĳd aan de belangen van Nederlandsch Guyana', 'Diemer- of Watergraafs-meersche courant', 'Drentsche courant', 'Duinkerksche historische courant', 'Europische : ... courant', "Feuille d'affiches, annonces et avis diversde Groningue = Advertentieblad, bekendmakingen en onderscheidene berigten van Groningen", "Feuille politique du département de l'Issel-supérieur = Staatkundig dagblad van het departement van den Boven-Ĳssel", 'Feuille politique du département du Zuiderzee = Staatkundig dagblad van hetDepartement der Zuiderzee', 'Friesche courant : gelykheid, vryheid en broederschap', "Gazette d'Amsterdam = Amsterdamsche courant", 'Gazette de Frise = Vriesche courant', 'Gazette de Groningue = Groninger courant', 'Gazette de Leuwarde = Leeuwarder courant', 'Gazette de Middelbourg = Middelburgsche courant', 'Gazette de Rotterdam', "Gazette du département de l'Ems occidental = Courant van het departement van de Wester Eems", "Gazette d'Utrecht = Utrechtsche courant", "Gazette ordinaire d'Amsterdam", 'Geldersche historische courant', 'Generaliteits-courant', 'Geoctrojeerde Groninger courant', 'Geprivilegeerde Surinaamsche courant', 'Goudasche courant', 'Groninger courant', 'Haagsche courant', 'Haarlemse Courant', 'Haeghsche post-tydingen', 'Haegse post-tydinge', 'Haerlemse courante', 'Het Amsterdamsch handels- en effectenblad', 'Het nieuws van den dag : kleine courant', 'Historisch dagblad van Zeeland / onder red. van S. Dassevael', 'Hof courant', 'Hollandsche courant', 'Hollandsche historische courant',
              'Java-bode : nieuws, handels- en advertentieblad voor Nederlandsch-Indie', 'Java government gazette', 'Javasche courant', "Journal d'Amsterdam", 'Journal de La Haye', 'Journal de la province de Limbourg', 'Journal du département de la Frise = Dagblad van het departement Vriesland', "Journal du département des bouches de l'Escaut = Dagblad van het departement van de Schelde", 'Journal du département des bouches du Rhin', 'Journal historique', 'Keesings historisch archief : geïllustreerd dagboek van het hedendaagsch wereldgebeuren met voortdurend bijgewerkten alphabetischen index', 'Koloniaal nieuwsblad', 'Koninglyke staats-courant', 'Koninklĳke courant', "La gazette d'Amsterdam", "L'éclaireur : journal politique, commercial et littéraire de Maestricht", "L'éclaireur politique : journal de la province du Limbourg", 'Leeuwarder courant', 'Leydse courant', 'Markt en aankondigingsberichten', "Memoires qui doivent servir à la composition de la Gazette d'Amsterdam", 'Middelburgsche courant', "Moniteur d'Amsterdam = Moniteur van Amsterdam", 'Nationaale courant', 'Nederlandsche courant', 'Nederlandsche staatscourant', 'Nederlandsch-Indisch handelsblad', 'Nieuw Amsterdamsch handels- en effectenblad', 'Nieuwe Apeldoornsche courant', 'Nieuwe Rotterdamsche courant : staats-, handels-, nieuws- en advertentieblad', 'Nieuwe Surinaamsche courant', 'Nieuwe Surinaamsche courant en letterkundig dagblad', 'Nieuwe Veendammer courant', 'Nieuw Israelietisch weekblad', 'Nieuws- en advertentie-blad voor de provincie Drenthe', 'Nieuw weekblad : Venlooschecourant', 'Noord-Brabander', 'Noordhollandsche courant', 'Nouvelles de divers quartiers', 'Nouvelles extraordinaires de divers endroits', 'Nouvelles politiques, publiées à Leyde', 'Ommelander courant', 'Oprechte Haarlemsche courant', 'Oprechte Haarlemse courant', 'Oprechte Haerlemschecourant', 'Oprechte nationaale courant / red. J.H. Redelinghuys', 'Oprechte Nederlandsche courant', 'Opregte Groninger courant', 'Opregte Haarlemsche Courant', 'Opregte Leydse courant', 'Opregte nieuwe Groninger courant', 'Ordinaire Leydse courant', 'Ordinaris dingsdaeghse courante', 'Ordinarisse middel-weeckse courante', 'Overĳsselsche courant', 'Padangsch nieuws- en advertentie-blad', "Post-tydingen uyt 's Graven-hage", "Provinciaal dagblad van Noord-Braband en 's Hertogenbossche stads-courant", 'Provinciale Drentsche en Asser courant', "Provinciale Noordbrabantsche en 's Hertogenbossche courant", 'Provinciale Overijsselsche en Zwolsche courant', 'Provinciale Overĳsselsche en Zwolsche courant : staats-,handels-, nieuws- en advertentieblad', 'Rosendaalsche courant', 'Rotterdamsche courant', 'Rotterdamse courant', 'Samarangsch advertentie-blad', 'Saturdagsche courant van nieuws, smaak en vernuft', "'s Gravenhaagsche courant", "'s Gravenhaegse courant", "'s Hertogenbossche courant", "'s Hertogenbossche vaderlandsche courant", 'Soerabaijasch handelsblad', 'Staatkundig dagblad der monden van de Maas', 'Staatkundig dagblad van de Rhyn-monden', 'Staatkundig dagblad van de Zuiderzee', "Suite des nouvelles d'Amsterdam", 'Sumatra-courant : nieuws- en advertentieblad', 'Surinaamsche courant', 'Surinaamsche courant en algemeene nieuwstijdingen', 'Surinaamsche courant en Gouvernements advertentie blad', 'Surinaamsche courant : letterkundig dagblad', 'Surinaamsch weekblad', 'Suriname : koloniaal nieuws- en advertentieblad', 'Tĳdinghe uyt verscheyde quartieren', 'Tilburgsche courant', 'Traduction libre des gazettes flamandes et autres', 'Tubantia', 'Utrechtsche courant', 'Utrechtsche provinciale enstads-courant : algemeen advertentieblad', 'Utrechtsch provinciaal en stedelĳk dagblad : algemeen advertentie-blad', 'Utrechtse courant', 'Utrechts volksblad : sociaal-democratisch dagblad', 'Vaderlandsche Bossche courant', 'Veendammer courant', 'Venloosch weekblad', 'Vlissingsche courant', 'Vriesche courant', 'VVeeckelycke courante van Europa', 'Watergraafsmeer courant', 'Weekblad van Tilburg', 'Weeklykche Woensdaagsche Surinaamsche Courant', 'Zuid-Hollandsche courant / [Johan Christiaan ten Noever]']

    libs = [
        "Archief Eemland",
        "Bibliotheek Arnhem",
        "Calvin College Archives, Michigan",
        "Gelders Archief",
        "Gemeentearchief Hulst",
        "Gemeentearchief Sluis",
        "Groninger Archieven",
        "Herzog August Bibliothek, Wolfenbüttel",
        "Historisch Centrum Overijssel",
        "Joint Archives of Holland, Michigan",
        "Koninklijk Instituut voor de Tropen (KIT)",
        "Koninklijk Instituut voor Taal-, Land- en Volkenkunde (KITLV)",
        "Koninklijke Bibliotheek",
        "Kungliga Biblioteket, Stockholm",
        "L'Archivio Segreto Vaticano",
        "Museum Enschede",
        "Museum Meermanno",
        "Nationaal Archief Suriname, Paramaribo",
        "Niedersächsiches Landesarchiv – Staatsarchiv, Oldenburg",
        "NIOD",
        "Northwestern College, Orange City",
        "Noord-Hollands Archief",
        "Persmuseum",
        "Privécollectie André de Rijck",
        "Radboud Universiteit Nijmegen",
        "Regionaal Archief Alkmaar",
        "Regionaal Archief Leiden",
        "Roosevelt Institute for American Studies (RIAS)",
        "Russisch Staatsarchief voor Oude Akten (RGADA) Moskou",
        "Rutgers University Library, New Brunswick",
        "SGP-bureau",
        "Sociaal Historisch Centrum voor Limburg",
        "Stadsarchief 's-Hertogenbosch",
        "Stadsarchief Rotterdam",
        "Stadsbibliotheek Maastricht",
        "The National Archives Kew, Richmond",
        "Tresoar – Fries Historisch en Letterkundig Centrum",
        "Trinity Christian College, Palos Heights",
        "Universiteitsbibliotheek Gent",
        "Universiteitsbibliotheek Groningen",
        "Universiteitsbibliotheek Leiden",
        "Universiteitsbibliotheek Tilburg",
        "Universiteitsbibliotheek Amsterdam (UvA)",
        "Universiteitsbibliotheek VU Amsterdam",
        "Waterlands Archief",
        "Wisconsin Historical Society, Madison",
        "Zeeuws Archief",
        "ZB| Planbureau en Bibliotheek van Zeeland",
        "Zentralbibliothek, Zürich"
    ]

    distribution = {
        'Landelijk': 'National',
        'Nederlands-Indië / Indonesië': 'Dutch East Indies/Indonesia',
        'Nederlandse Antillen': 'Netherlands Antilles',
        'Regionaal/lokaal': 'Regional/local',
        'Suriname': 'Surinam',
        'Verenigde Staten': 'United States of America',
        'onbekend': 'unknown',
    }

    fields = [
        Field(
            name='date',
            display_name='Date',
            description='Publication date.',
            es_mapping={'type': 'date', 'format': 'yyyy-MM-dd'},
            results_overview=True,
            preselected=True,
            visualization_type='timeline',
            search_filter=filters.DateFilter(
                config.DUTCHNEWSPAPERS_MIN_DATE,
                config.DUTCHNEWSPAPERS_MAX_DATE,
                description=(
                    'Accept only articles with publication date in this range.'
                )
            ),
            extractor=extract.XML(tag='date',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  },
                                  transform=lambda x: str(x)
                                  )
        ),
        Field(
            name='newspaper_title',
            display_name='Newspaper title',
            description='Title of the newspaper',
            results_overview=True,
            preselected=True,
            es_mapping={'type': 'keyword'},
            visualization_type='term_frequency',
            sortable=True,
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in these newspapers.',
                options=papers
            ),
            extractor=extract.XML(tag='title',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='version_of',
            display_name='Version of',
            description='The newspaper is a version of this newspaper.',
            extractor=extract.XML(tag='isVersionOf',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='issue_number',
            display_name='Issue number',
            description='Issue number of the newspaper',
            preselected=True,
            extractor=extract.XML(tag='issuenumber',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='category',
            display_name='Category',
            description='Whether the item is an article, advertisment, etc.',
            es_mapping={'type': 'keyword'},
            extractor=extract.XML(tag='subject',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='circulation',
            display_name='Circulation',
            description='The area in which the newspaper was distributed.',
            es_mapping={'type': 'keyword'},
            extractor=extract.XML(tag='spatial',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='publisher',
            display_name='Publisher',
            description='Publisher',
            extractor=extract.XML(tag='publisher',
                                  toplevel=True,
                                  multiple=True,
                                  flatten=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='language',
            display_name='Language',
            description='language',
            es_mapping={'type': 'keyword'},
            visualization_type='term_frequency',
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in these newspapers.',
                options=['nl', 'fr']
            ),
            extractor=extract.XML(tag='language',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='article_title',
            display_name='Article title',
            description='Article title',
            results_overview=True,
            preselected=True,
            extractor=extract.XML(tag='title', flatten=True, toplevel=True)
        ),
        Field(
            name='id',
            display_name='ID',
            description='Unique identifier of the entry.',
            extractor=extract.Metadata('id')
        ),
        Field(
            name='source',
            display_name='Source',
            description='Library or archive which keeps the hard copy of this newspaper.',
            es_mapping={'type': 'keyword'},
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles from these libraries or archives.',
                options=libs
            ),
            extractor=extract.XML(tag='source',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  }
                                  )
        ),
        Field(
            name='spatial',
            display_name='Distribution',
            description='Distribution area of the newspaper.',
            results_overview=True,
            preselected=True,
            es_mapping={'type': 'keyword'},
            visualization_type='term_frequency',
            sortable=True,
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in newspapers with this distribution area.',
                options=list(distribution.keys())
            ),
            extractor=extract.XML(tag='spatial',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  },
                                  )
        ),
        Field(
            name='temporal',
            display_name='Publication frequency',
            description='publication frequency of the newspaper.',
            results_overview=True,
            preselected=True,
            es_mapping={'type': 'keyword'},
            visualization_type='term_frequency',
            sortable=True,
            search_filter=filters.MultipleChoiceFilter(
                description='Accept only articles in newspapers with this publication frequency.',
                options=['Dag', 'Week', 'Maand'],
            ),
            extractor=extract.XML(tag='temporal',
                                  toplevel=True,
                                  recursive=True,
                                  external_file={
                                      'file_tag': 'definition',
                                      'xml_tag_toplevel': 'DIDL',
                                      'xml_tag_entry': 'Item'
                                  },
                                  )
        ),
        Field(
            name='content',
            display_name='Content',
            display_type='text_content',
            description='Text content.',
            results_overview=True,
            preselected=True,
            extractor=extract.XML(tag='p', multiple=True,
                                  flatten=True, toplevel=True)
        ),
    ]
