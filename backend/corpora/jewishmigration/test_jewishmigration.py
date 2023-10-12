import os
from corpora.utils_test import corpus_from_api

here = os.path.abspath(os.path.dirname(__file__))

mock_response = [
    {
        "identifier": 5,
        "source": "Le Bohec 1981 n. 71",
        "language": "Latin",
        "script": "Latin",
        "place_name": "Constanine/ Cirta",
        "area": "Algeria",
        "region": "Africa Proconsularis ",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                36.36811466666666,
                6.613302666666667
            ]
        },
        "site_type": "Inscription",
        "inscription_type": "Epitaph",
        "period": "II AD",
        "centuries": "2",
        "inscriptions_count": 1,
        "religious_profession": "",
        "sex_dedicator": "",
        "sex_deceased": "Female",
        "symbol": "",
        "comments": "",
        "inscription": "",
        "transcription": "To the shadows of the underworld Julia Victoria the Jewess(?) CV"
    },
    {
        "identifier": 6,
        "source": "Le Bohec 1981 n. 72",
        "language": "Latin",
        "script": "Latin",
        "place_name": "Ksour el-Gannaïa/ Festis",
        "area": "Algeria",
        "region": "Africa Proconsularis ",
        "coordinates": None,
        "site_type": "Inscription",
        "inscription_type": "",
        "period": "VI AD",
        "centuries": "4",
        "inscriptions_count": 1,
        "religious_profession": "",
        "sex_dedicator": "",
        "sex_deceased": "",
        "symbol": "",
        "comments": "Fragment of a marble cancel",
        "inscription": "",
        "transcription": "Fear the faithful (?)"
    },
    {
        "identifier": 7,
        "source": "Le Bohec 1981 n. 73",
        "language": "Latin",
        "script": "Latin",
        "place_name": "Setif",
        "area": "Algeria",
        "region": "Mauretania Caesariensis",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                5.4,
                36.18333333333333
            ]
        },
        "site_type": "Inscription",
        "inscription_type": "Epitaph",
        "period": "VI AD",
        "centuries": "4",
        "inscriptions_count": 1,
        "religious_profession": "",
        "sex_dedicator": "Male",
        "sex_deceased": "Female",
        "symbol": "",
        "comments": "Stone in the form of a box: inscription in a molded frame",
        "inscription": "",
        "transcription": "Caelia Thalassa the Jewess lived for 20 years and 4 months; Marcus Auillius Iaunuaris the loving husband"
    },
]

def test_jewishmigration(settings, db, admin_client):
    settings.CORPORA = {
        'jewishmigration': os.path.join(here, 'jewishmigration.py')
    }
    settings.JMIG_DATA = '/some/path' #'http://some/path'
    corpus = corpus_from_api(admin_client)
    assert corpus['title'] == 'Modelling Jewish Migration'