import os
import pytest

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
            "book_id" : "2_cri_1965-1966-ordinaire1_027",
            "chamber" : "Assemblee Nationale",
            "country" : "France",
            "debate_id" : "1965-10-20_2",
            "debate_type" : "Ordinaire",
            "date" : "1965-10-20",
            "date_is_estimate": False,
            "era" : "5Th Republic",
            "legislature" : "2",
            "page" : "0",
            "page_source" : "2_cri_1965-1966-ordinaire1_027.pdf",
            "sequence" : "2",
            "speech" : "Trois questions orales sans débat de MM  . Davoust, Fanton et Ansquer à M . le ministre des finances et des affaires économiques.",
            "id" : "fr_5th_republic_assemblee_nationale_1965_2_0",
            "url" : "https://archives.assemblee-nationale.fr/2/cri/1965-1966-ordinaire1/027.pdf"
        }],
        'n_documents': 3
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
            'house': 'Eerste Kamer',
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
            'role': 'Chair',
            'party': None,
            'party_id': None,
            'party_full': None,
            'page': '493',
            # 'url': 'https://zoek.officielebekendmakingen.nl/h-ek-19992000-493-493.pdf',
            # 'sequence': 1,
        }],
        'n_documents': 4
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
    docs = get_documents(corpus)
    for target in corpus_object.get('docs'):
        doc = next(docs)
        for key in target:
            assert key in doc
            assert doc[key] == target[key]
    docs = get_documents(corpus)
    assert len(list(docs)) == corpus_object.get('n_documents')

def get_documents(corpus):
    sources = corpus.sources(
        start=corpus.min_date,
        end=corpus.max_date
    )
    return corpus.documents(sources)
