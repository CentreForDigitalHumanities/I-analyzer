from datetime import datetime
import requests

from conftest import mock_response
from addcorpus.python_corpora.load_corpus import load_corpus_definition


target_documents = [
    {
        "content": "SOMMAIRE DE FIGARO PAGE 2. Les Cours, les Ambassades, le Monde et la Ville. Les Echos. La fin du Bulletin vert. 1929-1930. PAGE 3. La Dernière Heure. Avant la Conférence de La Haye. Les méfaits de la tempête. PAGE 4. La Vie sportive. Revue de la Presse. Anne Douglas Sedgwick Marthe Ludérac. PAGE 5. Henri Rebois L'Art espagnol à l'Exposition de Barcelone. Robert Brussel Le Mouvement musical. Guy de Passillé Les Etrennes. Jacques Patin Les Premières. Les Alguazils Courrier des Lettres. Marc Hélys Revues étrangères. PAGE 6. La Bourse La Cote des Valeurs. Le Programme des spectacles. PAGE 7. Courrier des théâtres. Les Courses LA POLITIQUE La diplomatie ",
        "contributor": [
            "Villemessant, Hippolyte de (1810-1879). Directeur de publication",
            "Jouvin, Benoît (1810-1886). Directeur de publication",
        ],
        "date": "1930-01-01",
        "id": "bpt6k296099q",
        "issue": "01 janvier 19301930/01/01 (Numéro 1).",
        "url": "https://gallica.bnf.fr/ark:/12148/bpt6k296099q",
    }
]

def test_gallica_import(monkeypatch, gallica_corpus_settings):
    monkeypatch.setattr(requests, "get", mock_response)
    corpus_def = load_corpus_definition("figaro")
    sources = corpus_def.sources(
        start=datetime(year=1930, month=1, day=1),
        end=datetime(year=1930, month=12, day=31),
    )
    documents = list(corpus_def.documents(sources))
    assert len(documents) == 1
    for document, target in zip(documents, target_documents):
        for target_key in target.keys():
            assert document.get(target_key) == target.get(target_key)
