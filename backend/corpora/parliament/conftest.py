import pytest
import os

here = os.path.abspath(os.path.dirname(__file__))

@pytest.fixture()
def parliament_corpora_settings(settings):
    settings.CORPORA = {
        'parliament-uk': os.path.join(here, 'uk.py'),
        'parliament-netherlands': os.path.join(here, 'netherlands.py'),
        'parliament-canada': os.path.join(here, 'canada.py'),
        'parliament-germany-new': os.path.join(here, 'germany-new.py'),
        'parliament-germany-old': os.path.join(here, 'germany-old.py'),
        'parliament-france': os.path.join(here, 'france.py'),
        'parliament-sweden': os.path.join(here, 'sweden.py'),
        'parliament-sweden-old': os.path.join(here, 'sweden-old.py'),
        'parliament-denmark': os.path.join(here, 'denmark.py'),
        'parliament-denmark-new': os.path.join(here, 'denmark-new.py'),
        'parliament-finland': os.path.join(here, 'finland.py'),
        'parliament-finland-old': os.path.join(here, 'finland-old.py'),
        'parliament-norway': os.path.join(here, 'norway.py'),
        'parliament-norway-new': os.path.join(here, 'norway-new.py'),
        'parliament-ireland': os.path.join(here, 'ireland.py'),
        'parliament-europe': os.path.join(here, 'euparl.py'),
    }

    settings.PP_CANADA_DATA = os.path.join(here, 'tests', 'data', 'canada')
    settings.PP_DENMARK_DATA = os.path.join(here, 'tests', 'data', 'denmark')
    settings.PP_DENMARK_NEW_DATA = os.path.join(here, 'tests', 'data', 'denmark-new')
    settings.PP_EUPARL_DATA = os.path.join(here, 'tests', 'data', 'euparl')
    settings.PP_FINLAND_DATA = os.path.join(here, 'tests', 'data', 'finland')
    settings.PP_FINLAND_OLD_DATA = os.path.join(here, 'tests', 'data', 'finland-old')
    settings.PP_FR_DATA = os.path.join(here, 'tests', 'data', 'france')
    settings.PP_GERMANY_NEW_DATA = os.path.join(here, 'tests', 'data', 'germany-new')
    settings.PP_GERMANY_OLD_DATA = os.path.join(here, 'tests', 'data', 'germany-old')
    settings.PP_IRELAND_DATA = os.path.join(here, 'tests', 'data', 'ireland')
    settings.PP_NL_DATA = os.path.join(here, 'tests', 'data', 'netherlands')
    settings.PP_NL_RECENT_DATA = os.path.join(here, 'tests', 'data', 'netherlands-recent')
    settings.PP_NORWAY_DATA = os.path.join(here, 'tests', 'data', 'norway')
    settings.PP_NORWAY_NEW_DATA = os.path.join(here, 'tests', 'data', 'norway-new')
    settings.PP_SWEDEN_DATA = os.path.join(here, 'tests', 'data', 'sweden')
    settings.PP_SWEDEN_OLD_DATA = os.path.join(here, 'tests', 'data', 'sweden-old')
    settings.PP_UK_DATA = os.path.join(here, 'tests', 'data', 'uk')
