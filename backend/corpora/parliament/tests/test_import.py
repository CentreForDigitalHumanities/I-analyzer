import os
import warnings
import pytest
from datetime import datetime

from addcorpus.load_corpus import load_corpus

CORPUS_TEST_DATA = [
    {
        'name': 'parliament-canada',
        'docs': [
        {
            'date': '2015-02-02',
            'country': 'Canada',
            'debate_title': 'Government Orders',
            'debate_id': 'ca.proc.d.2015-02-02',
            'chamber': 'House of Commons',
            'party': 'New Democratic Party',
            'speaker': 'Jack Harris',
            'speaker_id': 'c846297d-8bc7-4e69-b6eb-31d0e19f7ec1',
            'speaker_constituency': 'St. John\'s East',
            'speech': 'Mr. Speaker, I suppose I could ask the member for Nanaimo—Alberni why the Government of Canada would put $280 million into last year\'s budget if it was intended to compensate for something that would happen in 2020.',
            'id': 'ca.proc.d.2015-02-02.16582.214',
            'topic': 'Business of Supply',
            'subtopic': 'Opposition Motion—Newfoundland and Labrador Fisheries Investment Fund',
        }],
        'n_documents': 3
    },
    {
        'name': 'parliament-france',
        'docs': [
        {
            "book_id" : "37531030876685 37531030876685/1/58 37531030876685_1_58_7",
            "chamber" : "Assemblee Nationale",
            "country" : "France",
            "date" : "1881-01-11",
            "date_is_estimate" : False,
            "debate_id" : "1881-01-11",
            "debate_type" : "",
            "era" : "3Rd Republic",
            "legislature" : "",
            "page" : "7",
            "page_source" : "X0000007.xml",
            "sequence" : "0",
            "speech" : """SOMMAIRE

Constitution du bureau provisoire.

Excuses. — Demande de congé.

Communication par M. le président de deux lettres par lesquelles MM. Lou;s Legrand et Drumel déclinent toute candidature aux fonctions de secrétaire.

Tirage au sort des bureaux.

Fixation de l'ordre du jour : MM. Georges Perin, de Colbert-Laplace, Guichard, Janvier de La Motte (Eure). — Demande de renvoi au 20 janvier de la prochaine séance : M. Laroche-Joubert. Adoption.

PRÉSIDBNCE DE M. DESSEAUX, DOYEN D'AGE La séance est ouverte à deux heures un quart.

M. le président. Aux termes de l'article 1er de la loi constitutionnelle du 16 juillet 1875, je déclare ouverte la session ordinaire de la Chambre des députés pour 1881.

J'invite lts six membres les plus jeunes de ''Assemblée à vouloir bien répondre à 'l'appel de leur nom pour prendre place au bureau en qualité de secrétaires provisoires.

(L'appel des noms des députés les plus jeunes est fait par un huissier.)

Sont successivement appelés : MM. Georges de Cassagnac, né le 17 févrièr 1855; Adrien Bastii, né Je 1er octobre 1853; Jules André, né le 23 août 1852 ; René Gautier, né le '25 avril 1852 ; Emile Réaux, né le 20 juin 1851 ; Le Provost de Launay fils, né le 8 juin 1850; René Eschasseriaux, né le 1. 1 mai 1850; Louis Janvier de La Motte, né le 23 août 1849; Lanauve, né le 24 mai 1849; Dreyfus, né le 5 mai 1849 ; Marcellin Pellet, né le 4 mars 1849 ; De Loqueyssip, né le 1er octobre 1848; Le comte de Breteuil, né le 17 septembre 1848; Roy de Loulay, né le 8 août 1848; D3 La Porte, né le 20 juin 1848 ; Thomson, né le 21 janvier 1848.

MM Georges de Cassagnac, Adrien Bstid, limile Réaux, Dreyfus, de Loqueyssie et Thomson répondent à l'appel de leurs noms et prennent placn au bureau.

M. le président. Le bureau probatoire est constitué.

MM. Fourot, de Douville-Maillefeu et Laisant s'excusent de ne pouvoir assister à la séance de ce jour.

M. Laumond demande un congé de vingt jours.

La demande sera renvoyéa à la commission des congés.

J'ai reçu de M. Louis Legrand la lettre suivante, dont je donne connaissance à la Chambré : « Valenciennes, 9 janvier 1881.

c Monsieur le président, « Je vous prie de vouloir bien annoncer à mes collègues que je ne me représente pas à leurs suffrages pour les fonctions de secrétaile.

« je saisis cette occasion pour remercier la Chambre de l'honneur qu'elle m'a fait en me choisissant comme l'un des membres de son bureau.

« Agréez, monsieur je président, i assurance de ma haute considération.

c Lotis LEGRAND, « Député du Nord. »

J'ai reçu également de M. Drumel la lettre suivante:

« Neuvizy (Ardennes', 10 janvier 1881.

c Monsieur le président, « Depuis deux ans, 1* Chambre m'a fait l'honneur de m'appeler à siéger, comme secrétaire, dans son bureau. Je lui en suis profondément reconnaissant; et, en la priant de charger un autre de ses membres des fonctions que je tenais de sa confiance, je lui exprime ma vive gratitude pour les témoignages d'estime et de sympathie qu'à différentes reprises elle a bien voulu me donner.

c Veuillez croire, monsieur le président, à mes sentiments respectueux et dévoués.

« DRUMEL. »

M. le président. L'ordre du jour appelle le tirage au sort des bureaux.

Il va y être procédé.

(Il est procédé au tirage au sort des bureaux dans les formes réglementaires.) M. le président. Messieurs, il y aurait lieu de procéder maintenant à la fixation de l'ordre du jour, mais je crois devoir faire remarquer à la Chambre qu'elle n'est pas en très-grand nombre. (81! si! à droite, — Non!

non ! sur un grand nombre de bancs à gauche.) M. Clémenceau. Il n'est pas nécessaire que la Chambre soit en très-grand nombre, il suffit qu'elle soit en nombre.

M. le président. Je n'ai pas dit que U Chambre n'était pas en nombre, j'ai dit qu'elld n'était pas en très-grand nombre.

M. Haentjens. "Etm n'a jamais été aussi nombreuse à une première séance !

M. le président. La date de l'ouverture dela session, qui est fixée par la loi constitutionnelle, se place cette année entre les deux scrutins relatifs aux élections municipales.

A droite. Qu'est-ce que cela fait?

M. le président beaucoup de nos collègues som encore retenus dans leurs d^oL^rtements.

A droite. Mais non ! mais non !

M. Laroche Joubert Il ne fallait pas nous convoquer alors ! (Interruptions diverses à droite et sur plusieurs bancs à gauche.) M. de Baudry-d'Asson. N.Jus sommes revenus exprès pour procéder à la nomination du bureau ; nous demandons que le bureau soit nommé aujourd'hui!M. le président. Il a paru à beaucoup d'entre vous que l'élection du bureau définitif doit se faire par le plus grand nombre possible de membres. (Interruptions à dro te et sur quelques bancs à gauche.) Je soumets donc à la Chambre la proposi.

tion de s'ajourner. (Bruyantes exclamations à droite.) Sur divers bancs à droite el à l'extrême oauchu. Non 1 non l Sur un grand nombre d'autres bancs. Mais si 1 c'est nécessaire 1 M. Georges Perin. Je demande la parole.

M. Laroche-Joubert. Je demande la pa.

role.

M le comte de Colbert-Laplace. Je demande la parole.

M. le président. La parole est à M.

Perin.

M. Georges Perin. Messieurs, je viens, au nom d'un certain nombre de mes amis et en mon nom personnel, demander à la Chambre de repousser la proposition d'ajournement qui vient d'être faLe pac noire honorable président. (Très bien ! très bien ! à droite et à l'extrême gauche.) Autant qu'il m'a été permis de l'entendre au milieu du bruit, je crois que la seule raison que notre honorable président ait fait valoir 7our justifier sa proposition, c'est que nous n enous pas en nombre.""",
            "id" : "3rd_republic_0",
            "url" : "http://gallica.bnf.fr/ark:/12148/bpt6k64418203",
            "url_html": ""
        }],
        'n_documents': 5
    },
    {
        'name': 'parliament-germany-new',
        'docs': [
        {
            'country': 'Germany',
            'date': '1949-09-22',
            'debate_id': '7',
            'speaker': 'Gebhard Seelos',
            'speaker_id': '11002141',
            'speaker_aristocracy': '',
            'speaker_academic_title': 'Dr.',
            'speaker_birth_country': 'Deutschland',
            'speaker_birthplace': 'München',
            'speaker_birth_year': '1901',
            'speaker_death_year': '1984',
            'speaker_gender': 'male',
            'speaker_profession': 'Dipl.-Volkswirt, Jurist, Diplomat, Staatsrat a. D.',
            'role': 'Member of Parliament',
            'role_long': None,
            'party': 'BP',
            'party_full': 'Bayernpartei',
            'party_id': '2',
            'speech': 'Baracken sind etwas Vorübergehendes; sie halten aber immer länger, als eigentlich geplant.',
            'id': '94',
        }],
        'n_documents': 2
    },
    {
        'name': 'parliament-germany-old',
        'docs': [
        {
            'country': 'Germany',
            'book_id': 'bsb00000436',
            'book_label': '1867/70,1 ( Protokolle mit Sach- und Sprechregister )',
            'parliament': 'Reichstag (Norddeutscher Bund/Zollparlamente) 1867 - 1895 Norddeutscher Bund',
            'date': '1867-02-25',
            'date_is_estimate': 'true',
            'page': '27',
            'source_url': 'https://api.digitale-sammlungen.de/iiif/image/v2/bsb00000436_00027/full/full/0/default.jpg',
            'speech': "Nach vorangegangenem Gottesdienste in der Königlichen Schloßcapelle und der St. Hedwigskirche versammelten sich Heute- Nachmittags 11 Uhr die durch Allerhöchstes Patent vom 13. d. M. einberufenen Mitglieder des Reichstages des Norddeutschen Bundes im Weißen Saale des Königlichen Schlosses. Bald daraus traten die Reichstags-Commifsarien ein. Nachdem dieselben links vom Throne sich ausgestellt und die Versammlung sich -geordnet hatte, machte der Vorsitzende der Reichstags-Commissarien, Gras von Bismarck, Seiner Majestät dem Könige davon Meldung. Allerhöchst dieselben begaben Sich daraus in Begleitung Ihrer Königlichen Hoheiten des Kronprinzen und der Prinzen des Königlichen Hauses in dem nach dem Programm geordneten Zuge, unter 'Vortragung der Reichs-Insignien, nach dem Weißen Saale und nahmen, mit einem lebhaften dreimaligen Hoch, welches der Wirkliche Geheime Rath von Frankenberg ausbrachte, von der Versammlung empfangen, auf dem Throne Platz, während Seine Königliche Hoheit der Kronprinz guf der mittleren Stufe desselben, Ihre Königlichen Hoheiten die Prinzen des Königlichen Hauses zur Rechten des Thrones sich aufstellten. Seine Majestät der König verlasen hierauf, das Haupt mit dem Helme bedeckt, die nachfolgende Rede:",
            'id': '0',
        }],
        'n_documents': 1
    },
    {
        'name': 'parliament-netherlands',
        'docs': [
            {
                'country': 'Netherlands',
                'date': '2000-01-18',
                'chamber': 'Eerste Kamer',
                'debate_title': 'Presentie en opening (dinsdag 18 januari 2000)',
                'debate_id': 'nl.proc.ob.d.h-ek-19992000-493-493',
                'topic': 'Presentie en opening',
                'speech': '\n'.join([
                    'Ik deel aan de Kamer mede, dat zijn ingekomen berichten van verhindering van de leden:',
                    'Kohnstamm, wegens ziekte;',
                    'Boorsma, wegens verblijf buitenslands.',
                ]),
                'id': 'nl.proc.ob.d.h-ek-19992000-493-493.1.5.1',
                'speaker': 'De voorzitter Jurgens',
                'speaker_id': 'nl.m.01992',
                'speaker_gender': None,
                'role': 'Chair',
                'party': None,
                'party_id': None,
                'party_full': None,
                'page': '493',
                'url': 'https://zoek.officielebekendmakingen.nl/h-ek-19992000-493-493.pdf',
                'sequence': 1,
            }
        ],
        'n_documents': 4,
        'end': datetime(2015, 1, 1),
    },
    {
        'name': 'parliament-netherlands',
        'docs': [
            {
                'country': 'Netherlands',
                'date': '2017-01-31',
                'chamber': 'Tweede Kamer',
                'debate_title': 'Report of the meeting of the Dutch Lower House, Meeting 46, Session 23 (2017-01-31)',
                'debate_id': 'ParlaMint-NL_2017-01-31-tweedekamer-23',
                'topic': 'Rapport "Welvaart in kaart"',
                'speech': 'Ik heet de minister van Economische Zaken van harte welkom.',
                'id': 'ParlaMint-NL_2017-01-31-tweedekamer-23.u1',
                'speaker': 'Khadija Arib',
                'speaker_id': '#KhadijaArib',
                'speaker_gender': 'vrouw',
                'role': 'Chair',
                'party': 'PvdA',
                'party_id': '#party.PvdA',
                'party_full': 'Partij van de Arbeid',
                'page': None,
                'url': None,
                'sequence': 1,
            }
        ],
        'n_documents': 98,
        'start': datetime(2015, 1, 1),
    },
    {
        'name': 'parliament-uk',
        'docs': [
        {
            'country': 'United Kingdom',
            'date': '1872-02-06',
            'chamber': 'House of Commons',
            'debate_title': 'New Writs During The Recess',
            'debate_id': '',
            'speech': "acquainted the House, —that he had issued Warrants for New Writs, for Truro, v. Hon. John Cranch Walker Vivian, Under Secretary to the Eight hon. Edward Cardwell; for Plymouth, Sir Robert Porrett Collier, knight, one of the Justices of the Court of Common Pleas; Dover, George Jessel, esquire, Solicitor General; York County (West Riding, Northern Division), Sir Francis Crossley, baronet, deceased; Limerick City, Francis William Russell, esquire, deceased; Galway County, Eight hon. William Henry Gregory, Governor and Commander in Chief of the Island of Ceylon and its dependencies; Kerry, Eight hon. Valentine Augustus Browne, commonly called Viscount Castlerosse, now Earl of Kenmare.",
            'id': 'guldi_c19_365565',
            'speaker': 'Mr. Speaker',
            'speaker_id': '',
            'speech_type': '',
            'topic': '',
            'subtopic': '',
            'sequence': '365565'
        },
        {
            'country': 'United Kingdom',
            'date': '2020-01-14',
            'chamber': 'House of Commons',
            'debate_title': 'House Of Commons Debate On 14/01/2020',
            'debate_id': 'debates2020-01-14c',
            'speech': "What steps his Department is taking to ensure that legal aid is accessible to people who need it.",
            'id': 'uk.org.publicwhip/debate/2020-01-14c.865.4',
            'speaker': 'Sarah Dines',
            'speaker_id': 'uk.org.publicwhip/person/25877',
            'speech_type': 'Start Question',
            'topic': 'The Secretary of State was asked—',
            'subtopic': 'Legal Aid Access',
            'sequence': '0'
        }],
        'n_documents': 2
    }
]

@pytest.mark.parametrize("corpus_object", CORPUS_TEST_DATA)
def test_imports(test_app, corpus_object):
    corpus = load_corpus(corpus_object.get('name'))
    assert len(os.listdir(os.path.abspath(corpus.data_directory))) != 0

    start = corpus_object['start'] if 'start' in corpus_object else corpus.min_date
    end = corpus_object['end'] if 'end' in corpus_object else corpus.max_date

    docs = get_documents(corpus, start, end)
    for target in corpus_object.get('docs'):
        doc = next(docs)
        for key in target:
            assert key in doc
            assert doc[key] == target[key]

    for key in doc:
        if not key in target:
            message = 'Key "{}" is included the result for {} but has no specification'.format(key, corpus_object.get('name'))
            warnings.warn(message)

    docs = get_documents(corpus)
    assert len(list(docs)) == corpus_object.get('n_documents')

def get_documents(corpus):
    sources = corpus.sources(
        start=corpus.min_date,
        end=corpus.max_date
    )
    return corpus.documents(sources)
