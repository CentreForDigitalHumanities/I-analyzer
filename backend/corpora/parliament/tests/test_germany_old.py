from addcorpus.load_corpus import load_corpus
import os
from datetime import datetime

target_docs = [
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
    }
]

def test_germany_old(test_app):
    corpus = load_corpus('parliament-germany-old')

    # Assert that indeed we are drawing sources from the testing folder
    assert os.path.join(os.path.dirname(__file__), 'data', 'germany-old') == os.path.abspath(corpus.data_directory)

    # Obtain our mock source CSV
    sources = corpus.sources(
        start=datetime(1970,1,1),
        end=datetime(2022,1,1)
    )
    docs = corpus.documents(sources)

    for target in target_docs:
        doc = next(docs)

        for key in target:
            assert key in doc
            print(key)
            assert doc[key] == target[key]