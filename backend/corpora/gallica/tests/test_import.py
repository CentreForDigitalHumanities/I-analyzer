import time

import pytest
import requests

from conftest import MockResponseFactory, mock_sleep
from addcorpus.python_corpora.load_corpus import load_corpus_definition


target_data = {
    'figaro': {
        'n_documents': 1,
        'documents': [
            {
                "content": "SOMMAIRE DE FIGARO PAGE 2.",
                "contributor": [
                    "Villemessant, Hippolyte de (1810-1879). Directeur de publication",
                    "Jouvin, Benoît (1810-1886). Directeur de publication",
                ],
                "date": "1930-01-01",
                "id": "bpt6k296099q",
                "issue": "01 janvier 19301930/01/01 (Numéro 1).",
                "url": "https://gallica.bnf.fr/ark:/12148/bpt6k296099q",
            }
        ],
    },
    'caricature': {
        'n_documents': 1,
        'documents': [
            {
                "content": "2n premier volume de La GCaricature.",
                "contributor": [
                    'Philipon, Charles (1800-1862). Directeur de publication',
                    'Audibert, Auguste (18..?-1832). Rédacteur',
                    'Desnoyers, Louis (1802-1868). Rédacteur',
                    'Gonzalès, Emmanuel (1815-1887). Directeur de publication',
                    'Huart, Louis (1813-1865). Rédacteur',
                ],
                "date": "1830-11-04",
                "id": "bpt6k1048832g",
                "issue": "04 novembre 18301830/11/04 (T1,N1).",
                "publisher": "Aubert (Paris)[s.n.][s.n.] (Paris)",
                "url": "https://gallica.bnf.fr/ark:/12148/bpt6k1048832g",
            }
        ],
    },
    'journauxresistance': {
        'n_documents': 10,
        'documents': [
            {
                'content': 'CENTRE D f INFORMATION ET DE DOCUMENTATION cid/ïïx Document fi* 2 LM!',
                'contributor': [],
                'date': '1943-09-01',
                'id': 'bpt6k8724474',
                'issue': '01 septembre 19431943/09/01 (N2)-1943/09/30.',
                'title': "Document n°... / Centre d'information et de documentation ; Éditions MUR",
                'url': 'https://gallica.bnf.fr/ark:/12148/bpt6k8724474',
            }
        ],
    },
}


@pytest.mark.parametrize('corpus_name', ['caricature', 'figaro', 'journauxresistance'])
def test_gallica_import(corpus_name, monkeypatch, gallica_corpus_settings):
    mock = MockResponseFactory(corpus_name)
    monkeypatch.setattr(requests, "get", mock.mock_response)
    monkeypatch.setattr(time, "sleep", mock_sleep)
    corpus_def = load_corpus_definition(corpus_name)
    if hasattr(corpus_def, 'publication_ids'):
        # for composite corpora such as Resistance: shorten number of checked publication ids
        corpus_def.publication_ids = corpus_def.publication_ids[:10]

    sources = corpus_def.sources(
        start=corpus_def.min_date,
        end=corpus_def.max_date,
    )
    documents = list(corpus_def.documents(sources))
    assert len(documents) == target_data.get(corpus_name).get('n_documents')
    for document, target in zip(
        documents[:1], target_data.get(corpus_name).get('documents')
    ):
        for target_key in target.keys():
            if target_key == 'content':
                assert document.get(target_key).startswith(target.get(target_key))
            else:
                assert document.get(target_key) == target.get(target_key)
